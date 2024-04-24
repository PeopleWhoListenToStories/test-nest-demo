import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios'
import { Repository } from 'typeorm'
import { map } from 'rxjs/operators'
import { User, WxLoginDTO, WxInfo } from './user.entity'

import { WxBizDataCrypt } from '../../utils/WxBizDataCrypt.util'
import { config as envConfig } from '../../../config/env'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {
    const name = this.configService.get('ADMIN_USER', 'admin')
    const password = this.configService.get('ADMIN_PASSWD', 'admin')
    this.createUser({ name, password, role: 'admin' })
      .then(() => {
        console.log(`管理员账户创建成功，用户名：${name}，密码：${password}，请及时登录系统修改默认密码`)
      })
      .catch(() => {
        console.log(`管理员账户已经存在，用户名：${name}，密码：${password}，请及时登录系统修改默认密码`)
      })
  }

  async findAll(queryParams): Promise<[User[], number]> {
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
  async createUser(user: Partial<User>): Promise<User> {
    const { name, password } = user

    if (!name || !password) {
      throw new HttpException('请输入用户名和密码', HttpStatus.BAD_REQUEST)
    }

    const existUser = await this.userRepository.findOne({ where: { name } })

    if (existUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
    }

    const newUser = await this.userRepository.create(user)
    await this.userRepository.save(newUser)
    return newUser
  }

  /**
   * 用户登录
   * @param user
   */
  async login(user: Partial<User>): Promise<User> {
    const { name, password } = user
    const existUser = await this.userRepository.findOne({ where: { name } })

    if (!existUser || !(await User.comparePassword(password, existUser.password))) {
      throw new HttpException(
        '用户名或密码错误',
        // tslint:disable-next-line: trailing-comma
        HttpStatus.BAD_REQUEST,
      )
    }

    if (existUser.status === 'locked') {
      throw new HttpException(
        '用户已锁定，无法登录',
        // tslint:disable-next-line: trailing-comma
        HttpStatus.BAD_REQUEST,
      )
    }

    return existUser
  }

  /**
   * 微信用户登录
   * @param user
   */
  async wxLogin(user: WxLoginDTO): Promise<Partial<User>> {
    const { code, encryptedData, iv } = user

    const url = `${envConfig.WX_AUTH_URL}?grant_type=${envConfig.WX_GRANT_TYPE}&appid=${envConfig.WX_APPID}&secret=${envConfig.WX_SECRET}&js_code=${code}`

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
      const pc = new WxBizDataCrypt(envConfig.WX_APPID, infoData.session_key)
      const data: WxInfo = pc.decryptData(encryptedData, iv)

      const newUser: Partial<User> = {}

      newUser.code = code
      newUser.isWx = 1
      newUser.openid = infoData.openid
      newUser.nickname = data.nickName
      newUser.appid = data.watermark.appid
      newUser.avatar = data.avatarUrl
      newUser.gender = data.gender
      // 生成一个新的token
      newUser.token = await this.certificate(newUser)
      const mergeUser = await this.userRepository.merge(newUser as User)
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
  async findById(id: number, openid?: string): Promise<User> {
    if (id) {
      return this.userRepository.findOne(id)
    } else {
      return this.userRepository.findOne({ where: { openid } })
    }
  }
  /**
   * 更新指定用户
   * @param id
   */
  async updateById(id, user): Promise<User> {
    const oldUser = await this.userRepository.findOne(id)
    delete user.password

    if (user.name && user.name !== oldUser.name) {
      const existUser = await this.userRepository.findOne({
        where: { name: user.name },
      })

      if (existUser) {
        throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
      }
    }

    const newUser = await this.userRepository.merge(oldUser, user)
    return this.userRepository.save(newUser)
  }

  /**
   * 更新指定用户密码
   * @param id
   */
  async updatePassword(id, user): Promise<User> {
    const existUser = await this.userRepository.findOne(id)
    const { oldPassword, newPassword } = user

    if (!existUser || !(await User.comparePassword(oldPassword, existUser.password))) {
      throw new HttpException(
        '用户名或密码错误',
        // tslint:disable-next-line: trailing-comma
        HttpStatus.BAD_REQUEST,
      )
    }

    const hashNewPassword = User.encryptPassword(newPassword)
    const newUser = await this.userRepository.merge(existUser, {
      password: hashNewPassword,
    })
    const d = await this.userRepository.save(newUser)
    return d
  }

  // 生成微信小程序token
  async certificate(user: Partial<User>) {
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
}
