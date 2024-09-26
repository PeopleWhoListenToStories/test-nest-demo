import { Injectable, HttpException, HttpStatus, forwardRef, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios'
import { Repository } from 'typeorm'
import { instanceToPlain } from 'class-transformer'
import { map } from 'rxjs/operators'

import { IUser, ORGANIZATION_LOGOS } from '~/constant'
import { UserEntity, WxLoginDTO, WxInfo } from '~/modules/user/user.entity'
import { OrganizationService } from '~/modules/organization/organization.service';
import { WxBizDataCrypt } from '~/utils/WxBizDataCrypt.util'
import { getConfig } from '~/config'

const config = getConfig()
const wxConfig = config.wx as {
  appId: string;
  authUrl: string;
  secret: string;
  grantType: string;
};
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly configService: ConfigService,

    @Inject(forwardRef(() => JwtService))
    private readonly jwtService: JwtService,

    private readonly httpService: HttpService,

    @Inject(forwardRef(() => OrganizationService))
    private readonly organizationService: OrganizationService,
  ) {
    this.createDefaultSystemAdminFromConfigFile();
    // const name = this.configService.get('ADMIN_USER', 'admin')
    // const password = this.configService.get('ADMIN_PASSWD', 'nimda')
    // this.createUser({ name, password, role: 'admin' })
    //   .then(() => {
    //     console.log(`管理员账户创建成功，用户名：${name}，密码：${password}，请及时登录系统修改默认密码`)
    //   })
    //   .catch(() => {
    //     console.log(`管理员账户已经存在，用户名：${name}，密码：${password}，请及时登录系统修改默认密码`)
    //   })
  }

    /**
   * 从配置文件创建默认系统管理员
   */
    private async createDefaultSystemAdminFromConfigFile() {
      if (await this.userRepository.findOne({ isSystemAdmin: true })) {
        return;
      }
  
      const _config = await this.configService.get('server.admin');
  
      if (!_config.name || !_config.password || !_config.email) {
        throw new Error(`请指定名称、密码和邮箱`);
      }
  
      if (await this.userRepository.findOne({ email: _config.email })) {
        return;
      }
  
      try {
        const res = await this.userRepository.create({
          ..._config,
          isSystemAdmin: true,
        });
        const createdUser = (await this.userRepository.save(res)) as unknown as IUser;
  
        await this.organizationService.createOrganization(createdUser, {
          name: createdUser.name,
          description: `${createdUser.name}的个人组织`,
          logo: ORGANIZATION_LOGOS[0],
          isPersonal: true,
        });
  
        console.log('[think] 已创建默认系统管理员，请尽快登录系统修改密码');
      } catch (e) {
        console.error(`[think] 创建默认系统管理员失败：`, e.message);
      }
    }

  async decodeToken(token) {
    const user = this.jwtService.decode(token) as UserEntity;
    return user;
  }

  async findAll(queryParams): Promise<[UserEntity[], number]> {
    const query = this.userRepository.createQueryBuilder('user').orderBy('user.createAt', 'DESC')

    if (typeof queryParams === 'object') {
      const { page = 1, pageSize = 12, status, ...otherParams } = queryParams

      query.skip((+page - 1) * +pageSize)
      query.take(+pageSize)

      if (status) {
        query.andWhere('user.status=:status').setParameter('status', status)
      }

      if (otherParams) {
        Object.keys(otherParams).forEach((key) => {
          query.andWhere(`user.${key} LIKE :${key}`).setParameter(`${key}`, `%${otherParams[key]}%`)
        })
      }
    }

    return query.getManyAndCount()
  }

  /**
   * 创建用户
   * @param user
   */
  async createUser(user: Partial<UserEntity>): Promise<UserEntity> {
    const { name, password } = user

    if (!name || !password) {
      throw new HttpException('请输入用户名和密码', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    const existUser = await this.userRepository.findOne({ where: { name } })

    if (existUser) {
      throw new HttpException('用户已存在', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    const newUser = await this.userRepository.create(user)
    await this.userRepository.save(newUser)
    return await this.userRepository.findOne({ where:{ name } })
  }

  /**
   * 用户登录
   * @param user
   */
  async login(user: Partial<UserEntity>): Promise<UserEntity> {
    const { name, password } = user
    const existUser = await this.userRepository.findOne({ where: { name } })

    if (!existUser || !(await UserEntity.comparePassword(password, existUser.password))) {
      throw new HttpException(
        '用户名或密码错误',
        // tslint:disable-next-line: trailing-comma
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    if (existUser.status === 'locked') {
      throw new HttpException(
        '用户已锁定，无法登录',
        // tslint:disable-next-line: trailing-comma
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    return existUser
  }

  /**
   * 微信用户登录
   * @param user
   */
  async wxLogin(user: WxLoginDTO): Promise<Partial<UserEntity>> {
    const { code, encryptedData, iv } = user

    const url = `${wxConfig.authUrl}?grant_type=${wxConfig.grantType}&appid=${wxConfig.appId}&secret=${wxConfig.secret}&js_code=${code}`

    const { status: infoStatus, data: infoData } = await this.getInfo(url) // 获取openid和session_key

    if (infoStatus !== 200) {
      throw new HttpException(`${infoData?.errcode || '数据到火星了，稍后回来～'}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    let token = ''
    // 如果openid不存在则为新用户
    const hasUser = await this.userRepository.findOne({ where: { openid: infoData.openid } })
    // 当前用户存在 用户更新时间字段记录更新
    if (hasUser) {
      hasUser.updateAt = new Date()
      const mergeUser = await this.userRepository.merge(hasUser)
      this.userRepository.save(mergeUser)
      // 直接取用户token
      token = hasUser.token
    } else {
      // 解密小程序返回的加密用户信息
      const pc = new WxBizDataCrypt(wxConfig.appId, infoData.session_key)
      const data: WxInfo = pc.decryptData(encryptedData, iv)

      const newUser: Partial<UserEntity> = {}

      newUser.code = code
      newUser.isWx = 1
      newUser.openid = infoData.openid
      newUser.nickname = data.nickName
      newUser.appid = data.watermark.appid
      newUser.avatar = data.avatarUrl
      newUser.gender = data.gender
      // 生成一个新的token
      newUser.token = await this.certificate(newUser)
      const mergeUser = await this.userRepository.merge(newUser as UserEntity)
      this.userRepository.save(mergeUser)
    }
    return Promise.resolve({
      token,
    })
  }

  /**
   * 获取指定用户
   * @param id
   * @param openid
   *
   */
  async findById(id: string, openid?: string): Promise<UserEntity> {
    if (id) {
      return this.userRepository.findOne(id)
    } else {
      return this.userRepository.findOne({ where: { openid } })
    }
  }

  /**
   * 根据 ids 查询一组用户
   * @param id
   * @returns
   */
  async findByIds(ids): Promise<IUser[]> {
    const users = await this.userRepository.findByIds(ids);
    return users.map((user) => instanceToPlain(user)) as IUser[];
  }
  
  /**
   * 更新指定用户
   * @param id
   */
  async updateById(id, user): Promise<UserEntity> {
    const oldUser = await this.userRepository.findOne(id)
    delete user.password

    if (user.name && user.name !== oldUser.name) {
      const existUser = await this.userRepository.findOne({
        where: { name: user.name },
      })

      if (existUser) {
        throw new HttpException('用户已存在', HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }

    const newUser = await this.userRepository.merge(oldUser, user)
    return this.userRepository.save(newUser)
  }

  /**
   * 更新指定用户密码
   * @param id
   */
  async updatePassword(id, user): Promise<UserEntity> {
    const existUser = await this.userRepository.findOne(id)
    const { oldPassword, newPassword } = user

    if (!existUser || !(await UserEntity.comparePassword(oldPassword, existUser.password))) {
      throw new HttpException(
        '用户名或密码错误',
        // tslint:disable-next-line: trailing-comma
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const hashNewPassword = UserEntity.encryptPassword(newPassword)
    const newUser = await this.userRepository.merge(existUser, {
      password: hashNewPassword,
    })
    const d = await this.userRepository.save(newUser)
    return d
  }

  // 生成微信小程序token
  async certificate(user: Partial<UserEntity>) {
    const payload = {
      openid: user.openid,
      nickname: user.nickname,
    }
    const token = this.jwtService.sign(payload)
    return token
  }

  async getInfo(url): Promise<any> {
    return this.httpService
      .post(url)
      .pipe(map((response) => response))
      .toPromise()
  }

  /**
   * 根据指定条件查找用户
   * @param opts
   * @returns
   */
  async findOne(opts: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.userRepository.findOne(opts);
    return user;
  }

}
