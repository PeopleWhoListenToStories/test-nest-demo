import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { instanceToPlain } from 'class-transformer'
import { Repository } from 'typeorm'

import { AuthEnum, DocumentStatus, EMPTY_DOCUMENT, IUser } from '../../constant'
import { CreateDocumentDto } from './create-document.dto'
import { Document } from './document.entity'
import { AuthService } from '../auth/auth.service'
import { WikiService } from '../wiki/wiki.service'
import { ShareDocumentDto } from './share-document.dto'
import { CollaborationService } from '../collaboration/collaboration.service'
import { UserService } from '../user/user.service'
import { ConfigService } from '@nestjs/config'
import { TemplateService } from '../template/template.service'
import { DocumentVersionService } from './document-version.service';

@Injectable()
export class DocumentService {
  private collaborationService: CollaborationService
  private documentVersionService: DocumentVersionService;

  constructor(
    @InjectRepository(Document)
    public readonly documentRepo: Repository<Document>,

    @Inject(forwardRef(() => ConfigService))
    private readonly configService: ConfigService,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    // @Inject(forwardRef(() => MessageService))
    // private readonly messageService: MessageService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @Inject(forwardRef(() => WikiService))
    private readonly wikiService: WikiService,

    @Inject(forwardRef(() => TemplateService))
    private readonly templateService: TemplateService,

    // @Inject(forwardRef(() => ViewService))
    // private readonly viewService: ViewService
  ) 
  {
    this.documentVersionService = new DocumentVersionService(this.userService);
    this.collaborationService = new CollaborationService(this.userService, this, this.templateService, this.documentVersionService, this.configService)
  }

  /**
   * 按 id 查取文档
   * @param user
   * @param dto
   * @returns
   */
  public async findById(id: string): Promise<Partial<Document>> {
    const document = await this.documentRepo.findOne(id)
    return instanceToPlain(document)
  }

  /**
   * 按 id 查取一组文档
   * @param user
   * @param dto
   * @returns
   */
  public async findByIds(ids: string[]): Promise<Array<Partial<Document>>> {
    const documents = await this.documentRepo.findByIds(ids)
    return documents.map((doc) => instanceToPlain(doc))
  }

  /**
   * 关键词搜索文档
   * @param keyword
   */
  async search(user, organizationId, keyword) {
    const userId = user.id
    const res = await this.documentRepo
      .createQueryBuilder('document')
      .andWhere('document.organizationId = :organizationId')
      .andWhere('document.title LIKE :keyword')
      .orWhere('document.content LIKE :keyword')
      .setParameter('organizationId', organizationId)
      .setParameter('keyword', `%${keyword}%`)
      .getMany()

    const ret = await Promise.all(
      res.map(async (doc) => {
        const auth = await this.authService.getAuth(userId, {
          organizationId: doc.organizationId,
          wikiId: doc.wikiId,
          documentId: doc.id,
        })

        return auth && [AuthEnum.creator, AuthEnum.admin, AuthEnum.member].includes(auth.auth) ? doc : null
      }),
    )

    const data = ret.filter(Boolean)

    return data
  }

  /**
   * 创建文档
   * @param user
   * @param dto
   * @param isWikiHome 知识库首页文档
   * @returns
   */
  public async createDocument(user: IUser, dto: CreateDocumentDto, isWikiHome = false) {
    await this.authService.canView(user.id, {
      organizationId: dto.organizationId,
      wikiId: dto.wikiId,
      documentId: null,
    })
    const [docs] = await this.documentRepo.findAndCount({ createUserId: user.id })
    const maxIndex = docs.length
      ? Math.max.apply(
          [],
          docs.map((doc) => +doc.index),
        )
      : -1

    let state = EMPTY_DOCUMENT.state

    if ('state' in dto) {
      state = Buffer.from(dto.state)
      delete dto.state
    }

    const data = {
      createUserId: user.id,
      isWikiHome,
      title: '未命名文档',
      index: maxIndex + 1,
      ...EMPTY_DOCUMENT,
      ...dto,
      state,
    }

    if (dto.templateId) {
      const template = await this.templateService.findById(dto.templateId);
      if (template) {
        if (template.createUserId !== user.id && !template.isPublic) {
          throw new HttpException('您无法使用该模板', HttpStatus.FORBIDDEN);
        }
        await this.templateService.useTemplate(user, template.id);
        Object.assign(data, {
          title: template.title,
          content: template.content,
          state: template.state,
        });
      }
    }

    const document = await this.documentRepo.save(await this.documentRepo.create(data))
    const { data: userAuthList } = await this.authService.getUsersAuthInWiki(document.organizationId, document.wikiId, null)

    await Promise.all([
      ...userAuthList
        .filter((userAuth) => userAuth.userId !== user.id)
        .map((userAuth) => {
          return this.authService.createOrUpdateAuth(userAuth.userId, {
            auth: userAuth.auth,
            organizationId: document.organizationId,
            wikiId: document.wikiId,
            documentId: document.id,
          })
        }),
      this.authService.createOrUpdateAuth(user.id, {
        auth: AuthEnum.creator,
        organizationId: document.organizationId,
        wikiId: document.wikiId,
        documentId: document.id,
      }),
    ])

    return instanceToPlain(document)
  }
  /**
   * 删除知识库下所有文档
   * @param user
   * @param wikiId
   */
  async deleteWikiDocuments(user, wikiId) {
    const docs = await this.documentRepo.find({ wikiId })
    await Promise.all(
      docs.map((doc) => {
        return this.deleteDocument(user, doc.id)
      }),
    )
  }
  /**
   * 删除文档
   * @param idd
   */
  async deleteDocument(user: IUser, documentId) {
    const document = await this.documentRepo.findOne(documentId)

    if (document.isWikiHome) {
      const isWikiExist = await this.wikiService.findById(document.wikiId)
      if (isWikiExist) {
        throw new HttpException('该文档作为知识库首页使用，无法删除', HttpStatus.FORBIDDEN)
      }
    }

    await this.authService.canDelete(user.id, {
      organizationId: document.organizationId,
      wikiId: document.wikiId,
      documentId: document.id,
    })

    const children = await this.documentRepo.find({
      parentDocumentId: document.id,
    })

    if (children && children.length) {
      const parentDocumentId = document.parentDocumentId
      await Promise.all(
        children.map(async (doc) => {
          const res = await this.documentRepo.create({
            ...doc,
            parentDocumentId,
          })
          await this.documentRepo.save(res)
        }),
      )
    }

    await Promise.all([
      this.authService.deleteDocument(document.organizationId, document.wikiId, document.id),
      this.documentRepo.remove(document),
      // this.viewService.deleteDeletedDocumentView(user, document.organizationId, document.id),
    ])
  }

  /**
   * 分享（或关闭分享）文档
   * @param id
   */
  async shareDocument(user: IUser, documentId, dto: ShareDocumentDto, nextStatus = null) {
    const document = await this.documentRepo.findOne(documentId)
    await this.authService.canEdit(user.id, {
      organizationId: document.organizationId,
      wikiId: document.wikiId,
      documentId: document.id,
    })
    nextStatus = !nextStatus ? (document.status === DocumentStatus.private ? DocumentStatus.public : DocumentStatus.private) : nextStatus
    const newData = await this.documentRepo.merge(document, {
      status: nextStatus,
      ...dto,
      sharePassword: dto.sharePassword || '',
    })
    const ret = await this.documentRepo.save(newData)
    return ret
  }

  /**
   * 获取指定用户在指定文档的权限
   * @param userId
   * @param documentId
   * @returns
   */
  public async getDocumentUserAuth(userId, documentId) {
    const document = await this.documentRepo.findOne(documentId)
    const authority = await this.authService.getAuth(userId, {
      organizationId: document.organizationId,
      wikiId: document.wikiId,
      documentId: document.id,
    })

    return {
      ...authority,
      readable: [AuthEnum.creator, AuthEnum.admin, AuthEnum.member].includes(authority.auth),
      editable: [AuthEnum.creator, AuthEnum.admin].includes(authority.auth),
    }
  }

  /**
   * 更新文档
   * @param user
   * @param documentId
   * @param dto
   * @returns
   */
  public async updateDocument(user: IUser, documentId: string, dto: any) {
    const document = await this.documentRepo.findOne(documentId)

    await this.authService.canEdit(user.id, {
      organizationId: document.organizationId,
      wikiId: document.wikiId,
      documentId: document.id,
    })

    const res = await this.documentRepo.create({ ...document, ...dto })
    const ret = await this.documentRepo.save(res)
    return instanceToPlain(ret)
  }
}
