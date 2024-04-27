import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as lodash from 'lodash';

import { IWiki, IOrganization, IPagination } from '../../constant/index'
import { UserEntity, WxLoginDTO } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { AuthEnum, IUser } from '../../constant'
import { AuthDto } from './auth.dto'
import { AuthEntity } from './auth.entity'
import { instanceToPlain } from 'class-transformer';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepo: Repository<AuthEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 获取用户权限
   * @param user
   * @param auth
   * @returns
   */
  public async getAuth(userId: IUser['id'], dto: Omit<AuthDto, 'auth'>) {
    const conditions = { userId, ...dto };
    const userAuth = await this.authRepo.findOne(conditions);
    return userAuth;
  }

  createToken(user: Partial<UserEntity>) {
    const accessToken = this.jwtService.sign(user)
    return accessToken
  }

  async login(user: Partial<UserEntity>) {
    const data = await this.userService.login(user)
    const token = this.createToken({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    })
    return Object.assign(data, { token })
  }

  async wxLogin(user: WxLoginDTO) {
    const data = await this.userService.wxLogin(user)
    return data
  }

  async checkAdmin() {
    return true
  }

  async validateUser(payload: UserEntity) {
    return await this.findById(payload.id);
  }

  /**
   * 根据 id 查询用户
   * @param id
   * @returns
   */
  async findById(id): Promise<IUser> {
    const user = await this.userService.findOne(id);
    return instanceToPlain(user) as IUser;
  }

  /**
   * 用户是否可查看目标
   * @param userId
   * @param dto
   * @returns
   */
  async canView(userId: IUser['id'], dto: Omit<AuthDto, 'auth'>) {
    const conditions: Partial<AuthEntity> = {
      userId: '878e0022-0dd8-4016-89a7-8b8e49d4bb37' || userId,
      organizationId: dto.organizationId,
      wikiId: dto.wikiId || null,
      documentId: dto.documentId || null,
    }
    console.log(`%c 🎠 🚀 : AuthService -> canView -> conditions `, `font-size:14px;background-color:#84d71f;color:black;`, conditions);

    const userAuth = await this.authRepo.findOne(conditions);

    if (!userAuth || userAuth.auth === AuthEnum.noAccess) {
      throw new HttpException('您没有权限', HttpStatus.FORBIDDEN);
    }

    return userAuth;
  }

  /**
   * 创建或更新用户权限
   * @param user
   * @param auth
   * @returns
   */
  public async createOrUpdateAuth(userId: IUser['id'], auth: AuthDto) {
    const targetAuth = auth.auth;
    delete auth.auth;
    const wrappedAuth = { userId, ...auth};
    const oldAuth = await this.authRepo.findOne(wrappedAuth);

    let newAuth: AuthEntity;

    if (oldAuth) {
      newAuth = await this.authRepo.save(await this.authRepo.merge(oldAuth, wrappedAuth, { auth: targetAuth }))
    } else {
      newAuth = await this.authRepo.save(await this.authRepo.create({ ...wrappedAuth, auth: targetAuth }))
    }

    if (newAuth.organizationId && !newAuth.wikiId && !newAuth.documentId) {
      // 用户被添加到组织，在组织内添加对应权限
      const wikiAuthList = await this.getWikisInOrganization(newAuth.organizationId);
      await Promise.all(
        wikiAuthList.map((wikiAuth) => {
          return this.createOrUpdateAuth(newAuth.userId, {
            auth: newAuth.auth,
            organizationId: newAuth.organizationId,
            wikiId: wikiAuth.wikiId,
            documentId: null,
          });
        })
      );
    } else if (newAuth.organizationId && newAuth.wikiId && !newAuth.documentId) {
      // 用户被添加到知识库，在知识库内添加对应权限
      const docsAuthList = await this.getDocumentsInWiki(newAuth.organizationId, newAuth.wikiId);
      await Promise.all(
        docsAuthList.map((auth) => {
          return this.createOrUpdateAuth(newAuth.userId, {
            auth: newAuth.auth,
            organizationId: newAuth.organizationId,
            wikiId: newAuth.wikiId,
            documentId: auth.documentId,
          });
        })
      );
    }
  }

  /**
   * 获取指定组织内所有知识库
   * @param userId
   */
  async getWikisInOrganization(organizationId: IOrganization['id']) {
    const data = await this.authRepo
      .createQueryBuilder('auth')
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.wikiId is NOT NULL')
      .andWhere('auth.documentId is NULL')
      .setParameter('organizationId', organizationId)
      .getMany();

    return lodash.uniqBy(data || [], (w) => w.wikiId);
  }

  /**
   * 获取指定知识库的所有用户权限
   * @param organizationId
   * @param wikiId
   * @param pagination 分页参数，不传获取所有
   * @returns
   */
  async getUsersAuthInWiki(organizationId: IOrganization['id'], wikiId: IWiki['id'], pagination: IPagination | null) {
    const query = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.auth IN (:...types)', {
        types: [AuthEnum.creator, AuthEnum.admin, AuthEnum.member, AuthEnum.noAccess],
      })
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.wikiId=:wikiId')
      .andWhere('auth.documentId is NULL')
      .setParameter('organizationId', organizationId)
      .setParameter('wikiId', wikiId);

    if (pagination) {
      const { page = 1, pageSize = 12 } = pagination;
      query.skip((+page - 1) * +pageSize);
      query.take(+pageSize);
    }
    const [data, total] = await query.getManyAndCount();

    return { data: data || [], total };
  }

  /**
   * 获取用户在指定组织可查看的知识库列表
   * @param userId
   */
  async getUserCanViewWikisInOrganization(userId: IUser['id'], organizationId: IOrganization['id']) {
    const [data, total] = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.auth IN (:...types)', {
        types: [AuthEnum.creator, AuthEnum.admin, AuthEnum.member, AuthEnum.noAccess],
      })
      .andWhere('auth.userId=:userId')
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.documentId is NULL')
      .setParameter('userId', userId)
      .setParameter('organizationId', organizationId)
      .getManyAndCount();

    return { data: data || [], total };
  }
  
  /**
   * 获取用户在指定组织创建的知识库列表
   * @param userId
   */
  async getUserCreateWikisInOrganization(userId: IUser['id'], organizationId: IOrganization['id']) {
    const [data, total] = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.auth=:auth')
      .andWhere('auth.userId=:userId')
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.documentId is NULL')
      .setParameter('auth', AuthEnum.creator)
      .setParameter('userId', userId)
      .setParameter('organizationId', organizationId)
      .getManyAndCount();

    return { data: data || [], total };
  }

  /**
   * 获取用户在指定组织参与的知识库列表
   * @param userId
   */
  async getUserJoinWikisInOrganization(userId: IUser['id'], organizationId: IOrganization['id']) {
    const [data, total] = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.auth IN (:...types)', { types: [AuthEnum.creator, AuthEnum.admin, AuthEnum.member] })
      .andWhere('auth.userId=:userId')
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.documentId is NULL')
      .setParameter('userId', userId)
      .setParameter('organizationId', organizationId)
      .getManyAndCount();

    return { data: data || [], total };
  }

  /**
   * 获取用户在指定知识库可查看的所有文档
   * @param userId
   */
  async getUserCanViewDocumentsInWiki(organizationId: IOrganization['id'], wikiId: IWiki['id']) {
    const data = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.auth IN (:...types)', { types: [AuthEnum.creator, AuthEnum.admin, AuthEnum.member] })
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.wikiId=:wikiId')
      .andWhere('auth.documentId IS NOT NULL')
      .setParameter('organizationId', organizationId)
      .setParameter('wikiId', wikiId)
      .getMany();

    return data;
  }

  /**
   * 获取指定知识库内所有文档
   * @param userId
   */
  async getDocumentsInWiki(organizationId: IOrganization['id'], wikiId: IWiki['id']) {
    const data = await this.authRepo
      .createQueryBuilder('auth')
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.wikiId=:wikiId')
      .andWhere('auth.documentId IS NOT NULL')
      .setParameter('organizationId', organizationId)
      .setParameter('wikiId', wikiId)
      .getMany();

    return lodash.uniqBy(data || [], (w) => w.documentId);
  }

  /**
   * 用户是否可编辑目标
   * @param userId
   * @param dto
   * @returns
   */
  async canEdit(userId: IUser['id'], dto: Omit<AuthDto, 'auth'>) {
    const conditions: Partial<AuthEntity> = {
      userId,
      organizationId: dto.organizationId,
      wikiId: dto.wikiId || null,
      documentId: dto.documentId || null,
    };

    const userAuth = await this.authRepo.findOne(conditions);

    if (!userAuth || ![AuthEnum.creator, AuthEnum.admin].includes(userAuth.auth)) {
      throw new HttpException('您没有权限', HttpStatus.FORBIDDEN);
    }

    return userAuth;
  }

  /**
   * 用户是否可删除目标
   * @param userId
   * @param dto
   * @returns
   */
  async canDelete(userId: IUser['id'], dto: Omit<AuthDto, 'auth'>) {
    const conditions: Partial<AuthEntity> = {
      userId,
      organizationId: dto.organizationId,
      wikiId: dto.wikiId || null,
      documentId: dto.documentId || null,
    };

    const userAuth = await this.authRepo.findOne(conditions);

    if (!userAuth || ![AuthEnum.creator].includes(userAuth.auth)) {
      throw new HttpException('您没有权限', HttpStatus.FORBIDDEN);
    }

    return userAuth;
  }

  /**
   * 获取用户可查看的组织 id 列表
   * @param userId
   */
  async getUserCanViewOrganizationIds(userId: IUser['id']) {
    const data = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.auth IN (:...types)', { types: [AuthEnum.creator, AuthEnum.admin, AuthEnum.member] })
      .andWhere('auth.userId=:userId')
      .andWhere('auth.wikiId is NULL')
      .andWhere('auth.documentId is NULL')
      .setParameter('userId', userId)
      .getMany();

    return (data || []).map((d) => d.organizationId);
  }

  /**
   * 获取指定组织的所有用户权限
   * @param organizationId
   * @param pagination 分页参数，不传获取所有
   * @returns
   */
  async getUsersAuthInOrganization(organizationId: IOrganization['id'], pagination: IPagination | null) {
    const query = await this.authRepo
      .createQueryBuilder('auth')
      .where('auth.auth IN (:...types)', {
        types: [AuthEnum.creator, AuthEnum.admin, AuthEnum.member, AuthEnum.noAccess],
      })
      .andWhere('auth.organizationId=:organizationId')
      .andWhere('auth.wikiId is NULL')
      .andWhere('auth.documentId is NULL')
      .setParameter('organizationId', organizationId);

    if (pagination) {
      const { page = 1, pageSize = 12 } = pagination;
      query.skip((+page - 1) * +pageSize);
      query.take(+pageSize);
    }

    const [data, total] = await query.getManyAndCount();

    return { data: data || [], total };
  }
  
  /**
   * 删除组织
   * 注意：该方法是直接删除，可调用 canDelete 判断是否可删除
   * @param organizationId
   */
  async deleteOrganization(organizationId: IOrganization['id']) {
    const res = await this.authRepo.find({
      organizationId,
    });
    await this.authRepo.remove(res);
  }

  /**
   * 操作他人权限
   * @param currentUserId
   * @param targetUserId
   * @param dto
   */
  private async operateOtherUserAuth(currentUserId: IUser['id'], targetUserId: IUser['id'], dto: AuthDto) {
    const targetUser = await this.userService.findOne({ id: targetUserId });

    if (!targetUser) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const conditions: Partial<AuthEntity> = {
      organizationId: dto.organizationId,
      wikiId: dto.wikiId || null,
      documentId: dto.documentId || null,
    };

    const currentUserAuth = await this.authRepo.findOne({
      userId: currentUserId,
      ...conditions,
    });

    if (!currentUserAuth) {
      throw new HttpException('您没有权限操作', HttpStatus.FORBIDDEN);
    }

    // 仅创建者、管理员可操作他人权限
    if (![AuthEnum.creator, AuthEnum.admin].includes(currentUserAuth.auth)) {
      throw new HttpException('您没有权限操作', HttpStatus.FORBIDDEN);
    }

    // 仅创建者可赋予他人创建者、管理员权限
    if ([AuthEnum.creator, AuthEnum.admin].includes(dto.auth) && currentUserAuth.auth !== AuthEnum.creator) {
      throw new HttpException('您没有权限操作', HttpStatus.FORBIDDEN);
    }

    const maybeTargetUserAuth = await this.authRepo.findOne({
      userId: targetUserId,
      ...conditions,
    });

    if (maybeTargetUserAuth) {
      // 对方是创建者，无权操作
      if (maybeTargetUserAuth.auth === AuthEnum.creator) {
        throw new HttpException('您没有权限操作', HttpStatus.FORBIDDEN);
      }

      // 对方是管理员，仅创建者可操作
      if (maybeTargetUserAuth.auth === AuthEnum.admin && currentUserAuth.auth !== AuthEnum.creator) {
        throw new HttpException('您没有权限操作', HttpStatus.FORBIDDEN);
      }
    }
  }
  
  /**
   * 删除他人权限
   * @param currentUserId
   * @param targetUserId
   * @param dto
   */
  async deleteOtherUserAuth(currentUserId: IUser['id'], targetUserId: IUser['id'], dto: AuthDto) {
    await this.operateOtherUserAuth(currentUserId, targetUserId, dto);

    const conditions: Partial<AuthEntity> = {
      userId: targetUserId,
      auth: dto.auth,
      organizationId: dto.organizationId,
      wikiId: dto.wikiId || null,
      documentId: dto.documentId || null,
    };

    const targetUserAuth = await this.authRepo.findOne(conditions);
    await this.authRepo.remove(targetUserAuth);

    if (targetUserAuth.organizationId && !targetUserAuth.wikiId && !targetUserAuth.documentId) {
      // 用户被从组织删除，需要删除在组织内的所有权限
      const res = await this.authRepo.find({
        userId: targetUserAuth.userId,
        organizationId: targetUserAuth.organizationId,
      });
      await this.authRepo.remove(res);
    } else if (targetUserAuth.organizationId && targetUserAuth.wikiId && !targetUserAuth.documentId) {
      // 用户被从知识库删除，需要删除在知识库的所有权限
      const res = await this.authRepo.find({
        userId: targetUserAuth.userId,
        organizationId: targetUserAuth.organizationId,
        wikiId: targetUserAuth.wikiId,
      });
      await this.authRepo.remove(res);
    }
  }

  /**
   * 为他人创建或更新权限
   * @param currentUserId
   * @param targetUserId
   * @param dto
   */
  async createOrUpdateOtherUserAuth(currentUserId: IUser['id'], targetUserId: IUser['id'], dto: AuthDto) {
    await this.operateOtherUserAuth(currentUserId, targetUserId, dto);
    await this.createOrUpdateAuth(targetUserId, dto);
  }
}
