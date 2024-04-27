import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { instanceToPlain } from "class-transformer";
import { Repository } from "typeorm";
import * as lodash from 'lodash'

import { AuthEnum, IUser } from "../../constant";
import { WikiEntity } from "./wiki.entity";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../user/user.service";
import { DocumentService } from "../document/document.service";
import { CreateWikiDto } from "./create-wiki.dto";

@Injectable()
export class WikiService {
  constructor(
    @InjectRepository(WikiEntity)
    private readonly wikiRepo: Repository<WikiEntity>,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    // @Inject(forwardRef(() => MessageService))
    // private readonly messageService: MessageService,

    // @Inject(forwardRef(() => StarService))
    // private readonly starService: StarService,

    @Inject(forwardRef(() => DocumentService))
    private readonly documentService: DocumentService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    // @Inject(forwardRef(() => ViewService))
    // private readonly viewService: ViewService
  ) {}

  /**
   * 创建知识库
   * @param user
   * @param dto CreateWikiDto
   * @returns
   */
  async createWiki(user: IUser, dto: CreateWikiDto) {
    const id = '878e0022-0dd8-4016-89a7-8b8e49d4bb37'

    await this.authService.canView(id || user.id, {
      organizationId: dto.organizationId,
      wikiId: null,
      documentId: null,
    });

    const createUserId = id || user.id;
    const data = {
      ...dto,
      createUserId,
    };
    const toSaveWiki = await this.wikiRepo.create(data);
    const wiki = await this.wikiRepo.save(toSaveWiki);

    const { data: userAuthList } = await this.authService.getUsersAuthInOrganization(wiki.organizationId, null);

    await Promise.all([
      ...userAuthList
        .filter((userAuth) => userAuth.userId !== id || user.id)
        .map((userAuth) => {
          return this.authService.createOrUpdateAuth(userAuth.userId, {
            auth: userAuth.auth,
            organizationId: wiki.organizationId,
            wikiId: wiki.id,
            documentId: null,
          });
        }),

      await this.authService.createOrUpdateAuth(id || user.id, {
        auth: AuthEnum.creator,
        organizationId: wiki.organizationId,
        wikiId: wiki.id,
        documentId: null,
      }),

      // await this.starService.toggleStar(user, {
      //   organizationId: wiki.organizationId,
      //   wikiId: wiki.id,
      // }),
    ]);

    const homeDoc = await this.documentService.createDocument(
      user,
      {
        organizationId: wiki.organizationId,
        wikiId: wiki.id,
        parentDocumentId: null,
        title: wiki.name,
      },
      true
    );

    const homeDocumentId = homeDoc.id;
    const withHomeDocumentIdWiki = await this.wikiRepo.merge(wiki, { homeDocumentId });
    await this.wikiRepo.save(withHomeDocumentIdWiki);
    return withHomeDocumentIdWiki;
  }
  
  /**
   * 获取当前用户所有知识库
   * @param user
   * @param pagination
   * @returns
   */
  async getAllWikis(user: IUser, organizationId) {
    await this.authService.canView(user.id, {
      organizationId,
      wikiId: null,
      documentId: null,
    });

    const { data: userWikiAuths, total } = await this.authService.getUserCanViewWikisInOrganization(
      user.id,
      organizationId
    );
    const wikiIds = userWikiAuths.map((userAuth) => userAuth.wikiId);

    const data = await this.wikiRepo.findByIds(wikiIds);
    const ret = await Promise.all(
      data.map(async (wiki) => {
        const createUser = await this.userService.findById(wiki.createUserId);
        return { ...wiki, createUser, isMember: true };
      })
    );

    return { data: ret, total };
  }

  /**
   * 获取当前用户创建的知识库
   * @param user
   * @param pagination
   * @returns
   */
  async getOwnWikis(user: IUser, organizationId) {
    await this.authService.canView(user.id, {
      organizationId,
      wikiId: null,
      documentId: null,
    });

    const { data: userWikiAuths, total } = await this.authService.getUserCreateWikisInOrganization(
      user.id,
      organizationId
    );
    const wikiIds = userWikiAuths.map((userAuth) => userAuth.wikiId);

    const data = await this.wikiRepo.findByIds(wikiIds);
    const ret = await Promise.all(
      data.map(async (wiki) => {
        const createUser = await this.userService.findById(wiki.createUserId);
        return { ...wiki, createUser, isMember: true };
      })
    );
    return { data: ret, total };
  }

  /**
   * 获取当前用户参与的知识库
   * @param user
   * @param pagination
   * @returns
   */
  async getJoinWikis(user: IUser, organizationId) {
    await this.authService.canView(user.id, {
      organizationId,
      wikiId: null,
      documentId: null,
    });

    const { data: userWikiAuths, total } = await this.authService.getUserJoinWikisInOrganization(
      user.id,
      organizationId
    );
    const wikiIds = userWikiAuths.map((userAuth) => userAuth.wikiId);

    const data = await this.wikiRepo.findByIds(wikiIds);
    const ret = await Promise.all(
      data.map(async (wiki) => {
        const createUser = await this.userService.findById(wiki.createUserId);
        return { ...wiki, createUser, isMember: true };
      })
    );

    return { data: ret, total };
  }
  
  /**
   * 获取知识库详情
   * @param user
   * @param wikiId
   * @returns
   */
  async getWikiDetail(user: IUser, wikiId: string) {
    const wiki = await this.wikiRepo.findOne(wikiId);
    await this.authService.canView(user.id, {
      organizationId: wiki.organizationId,
      wikiId: wiki.id,
      documentId: null,
    });
    const createUser = await this.userService.findById(wiki.createUserId);
    return { ...wiki, createUser };
  }

  /**
   * 获取知识库首页文档（首页文档由系统自动创建）
   * @param user
   * @param wikiId
   * @returns
   */
  async getWikiHomeDocument(user: IUser, wikiId) {
    const res = await this.documentService.documentRepo.findOne({ wikiId, isWikiHome: true });
    await this.authService.canView(user.id, {
      organizationId: res.organizationId,
      wikiId: res.wikiId,
      documentId: null,
    });
    return lodash.omit(instanceToPlain(res), ['state']);
  }
}