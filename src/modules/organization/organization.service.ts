import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from 'typeorm';

import { AuthEnum, IOrganization, IUser, buildMessageURL } from "../../constant";
import { UserEntity } from "../user/user.entity";
import { OrganizationEntity } from './organization.entity';
import { CreateOrganizationDto } from "./organization.dto";
import { OperateUserAuthDto } from "../auth/auth.dto";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../user/user.service";

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepo: Repository<OrganizationEntity>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  /**
   * 获取组织详情
   * @param user
   * @returns
   */
  public async getOrganizationDetail(user: IUser, id: IOrganization['id']) {
    const organization = await this.organizationRepo.findOne({ id });
    if (!organization) {
      throw new HttpException('组织不存在', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    await this.authService.canView(user.id, {
      organizationId: id,
      wikiId: null,
      documentId: null,
    });
    return organization;
  }

  /**
   * 获取用户个人组织
   * @param user
   * @returns
   */
  public async getPersonalOrganization(user: IUser) {
    const id = '878e0022-0dd8-4016-89a7-8b8e49d4bb37'

    const organization = await this.organizationRepo.findOne({ createUserId: id || user.id, isPersonal: true });
    return organization;
  }

  /**
   * 获取用户可访问的组织
   * @param user
   */
  public async getUserOrganizations(user: IUser) {
    const ids = await this.authService.getUserCanViewOrganizationIds(user.id);
    return await this.organizationRepo.findByIds(ids);
  }

  /**
   * 创建组织
   * @param user
   * @param dto
   * @returns
   */
  async createOrganization (user: IUser, dto: CreateOrganizationDto) { 
    const id = '878e0022-0dd8-4016-89a7-8b8e49d4bb37'
    const [, count] = await this.organizationRepo.findAndCount({ createUserId: id || user.id });

    if (count >= 5) {
      throw new HttpException('个人可创建组织上限为 5 个', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const data = {
      ...dto,
      createUserId: id || user.id,
    }

    const organization = await this.organizationRepo.save(await this.organizationRepo.create(data));

    await this.authService.createOrUpdateAuth( id || user.id, {
      auth: AuthEnum.creator,
      organizationId: organization.id,
      wikiId: null,
      documentId: null
    })
  }

  /**
   * 更新组织信息
   * @param user
   * @param dto
   */
  public async updateOrganization(user: IUser, organizationId: IOrganization['id'], dto: CreateOrganizationDto) {
    await this.authService.canEdit(user.id, {
      organizationId,
      wikiId: null,
      documentId: null,
    });

    const oldData = await this.organizationRepo.findOne(organizationId);

    if (!oldData) {
      throw new HttpException('目标组织不存在', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return await this.organizationRepo.save(await this.organizationRepo.merge(oldData, dto));
  }

  // /**
  //  * 删除组织
  //  * @param user
  //  * @param organizationId
  //  * @returns
  //  */
  // async deleteOrganization(user: IUser, organizationId) {
  //   const organization = await this.organizationRepo.findOne(organizationId);
  //   await this.authService.canDelete(user.id, {
  //     organizationId: organization.id,
  //     wikiId: null,
  //     documentId: null,
  //   });
  //   await this.wikiService.deleteOrganizationWiki(user, organizationId);
  //   await this.organizationRepo.remove(organization);
  //   await this.authService.deleteOrganization(organization.id);
  //   return organization;
  // }

  /**
   * 获取组织成员
   * @param user
   * @param shortId
   * @returns
   */
  public async getMembers(user: IUser, id: IOrganization['id'], pagination) {
    const organization = await this.organizationRepo.findOne({ id });

    if (!organization) {
      throw new HttpException('组织不存在', HttpStatus.NOT_FOUND);
    }

    await this.authService.canView(user.id, {
      organizationId: id,
      wikiId: null,
      documentId: null,
    });

    const { data: usersAuth, total } = await this.authService.getUsersAuthInOrganization(organization.id, pagination);

    const userIds = usersAuth.map((auth) => auth.userId);
    const users = await this.userService.findByIds(userIds);

    const withUserData = usersAuth.map((auth) => {
      return {
        auth,
        user: users.find((user) => user.id === auth.userId),
      };
    });

    return { data: withUserData, total };
  }

  // /**
  //  * 添加组织成员
  //  * @param user
  //  * @param wikiId
  //  * @param dto
  //  * @returns
  //  */
  // async addMember(user: UserEntity, organizationId, dto: OperateUserAuthDto) {
  //   const organization = await this.organizationRepo.findOne(organizationId);

  //   if (!organization) {
  //     throw new HttpException('组织不存在', HttpStatus.NOT_FOUND);
  //   }

  //   const targetUser = await this.userService.findOne({ name: dto.userName });

  //   if (!targetUser) {
  //     throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
  //   }

  //   const ret = await this.authService.createOrUpdateOtherUserAuth(user.id, targetUser.id, {
  //     auth: dto.userAuth,
  //     organizationId: organization.id,
  //     wikiId: null,
  //     documentId: null,
  //   });

  //   await this.messageService.notify(targetUser.id, {
  //     title: `您被添加到组织「${organization.name}」`,
  //     message: `您被添加到知识库「${organization.name}」，快去看看吧！`,
  //     url: buildMessageURL('toOrganization')({
  //       organizationId: organization.id,
  //     }),
  //     uniqueId: organization.id,
  //   });

  //   return ret;
  // }

  // /**
  //  * 修改组织成员
  //  * @param user
  //  * @param wikiId
  //  * @param dto
  //  * @returns
  //  */
  // async updateMember(user: UserEntity, organizationId, dto: OperateUserAuthDto) {
  //   const organization = await this.organizationRepo.findOne(organizationId);

  //   if (!organization) {
  //     throw new HttpException('组织不存在', HttpStatus.NOT_FOUND);
  //   }

  //   const targetUser = await this.userService.findOne({ name: dto.userName });

  //   if (!targetUser) {
  //     throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
  //   }

  //   const ret = await this.authService.createOrUpdateOtherUserAuth(user.id, targetUser.id, {
  //     auth: dto.userAuth,
  //     organizationId: organization.id,
  //     wikiId: null,
  //     documentId: null,
  //   });

  //   await this.messageService.notify(targetUser.id, {
  //     title: `组织「${organization.name}」权限变更`,
  //     message: `您在组织「${organization.name}」权限已变更，快去看看吧！`,
  //     url: buildMessageURL('toOrganization')({
  //       organizationId: organization.id,
  //     }),
  //     uniqueId: organization.id,
  //   });

  //   return ret;
  // }

  // /**
  //  * 删除组织成员
  //  * @param user
  //  * @param wikiId
  //  * @param dto
  //  * @returns
  //  */
  // async deleteMember(user: UserEntity, organizationId, dto: OperateUserAuthDto) {
  //   const organization = await this.organizationRepo.findOne(organizationId);

  //   if (!organization) {
  //     throw new HttpException('组织不存在', HttpStatus.NOT_FOUND);
  //   }

  //   const targetUser = await this.userService.findOne({ name: dto.userName });

  //   if (!targetUser) {
  //     throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
  //   }

  //   const ret = await this.authService.deleteOtherUserAuth(user.id, targetUser.id, {
  //     auth: dto.userAuth,
  //     organizationId: organization.id,
  //     wikiId: null,
  //     documentId: null,
  //   });

  //   await this.messageService.notify(targetUser.id, {
  //     title: `组织「${organization.name}」权限收回`,
  //     message: `您在组织「${organization.name}」权限已收回！`,
  //     url: buildMessageURL('toOrganization')({
  //       organizationId: organization.id,
  //     }),
  //     uniqueId: organization.id,
  //   });

  //   return ret;
  // }
}