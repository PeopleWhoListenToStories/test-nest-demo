import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { Repository } from 'typeorm';

import { AuthEnum, EMPTY_DOCUMENT, IUser } from '../../constant';
import { CreateDocumentDto } from './create-document.dto';
import { Document } from './document.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    public readonly documentRepo: Repository<Document>,

    // @Inject(forwardRef(() => ConfigService))
    // private readonly configService: ConfigService,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    // @Inject(forwardRef(() => MessageService))
    // private readonly messageService: MessageService,

    // @Inject(forwardRef(() => UserService))
    // private readonly userService: UserService,

    // @Inject(forwardRef(() => WikiService))
    // private readonly wikiService: WikiService,

    // @Inject(forwardRef(() => TemplateService))
    // private readonly templateService: TemplateService,

    // @Inject(forwardRef(() => ViewService))
    // private readonly viewService: ViewService
  ) {
    // this.documentVersionService = new DocumentVersionService(this.userService);
    // this.collaborationService = new CollaborationService(
    //   this.userService,
    //   this,
    //   this.templateService,
    //   this.documentVersionService,
    //   this.configService
    // );
  }
  
  /**
   * 关键词搜索文档
   * @param keyword
   */
  async search(user, organizationId, keyword) {
    const id = '878e0022-0dd8-4016-89a7-8b8e49d4bb37'
    const userId = id || user.id;
    const res = await this.documentRepo
      .createQueryBuilder('document')
      .andWhere('document.organizationId = :organizationId')
      .andWhere('document.title LIKE :keyword')
      .orWhere('document.content LIKE :keyword')
      .setParameter('organizationId', organizationId)
      .setParameter('keyword', `%${keyword}%`)
      .getMany();

    const ret = await Promise.all(
      res.map(async (doc) => {
        const auth = await this.authService.getAuth(userId, {
          organizationId: doc.organizationId,
          wikiId: doc.wikiId,
          documentId: doc.id,
        });

        return auth && [AuthEnum.creator, AuthEnum.admin, AuthEnum.member].includes(auth.auth) ? doc : null;
      })
    );

    const data = ret.filter(Boolean);

    return data;
  }

  /**
   * 创建文档
   * @param user
   * @param dto
   * @param isWikiHome 知识库首页文档
   * @returns
   */
  public async createDocument(user: IUser, dto: CreateDocumentDto, isWikiHome = false) {
    const id = '878e0022-0dd8-4016-89a7-8b8e49d4bb37'
    await this.authService.canView( id || user.id, {
      organizationId: dto.organizationId,
      wikiId: dto.wikiId,
      documentId: null,
    });
    const [docs] = await this.documentRepo.findAndCount({ createUserId: id || user.id });
    const maxIndex = docs.length ? Math.max.apply([], docs.map((doc) => +doc.index)) : -1;

    let state = EMPTY_DOCUMENT.state;

    if ('state' in dto) {
      state = Buffer.from(dto.state);
      delete dto.state;
    }

    const data = {
      createUserId: user.id,
      isWikiHome,
      title: '未命名文档',
      index: maxIndex + 1,
      ...EMPTY_DOCUMENT,
      ...dto,
      state,
    };
    console.log(data)

    // if (dto.templateId) {
    //   const template = await this.templateService.findById(dto.templateId);
    //   if (template) {
    //     if (template.createUserId !== user.id && !template.isPublic) {
    //       throw new HttpException('您无法使用该模板', HttpStatus.FORBIDDEN);
    //     }
    //     await this.templateService.useTemplate(user, template.id);
    //     Object.assign(data, {
    //       title: template.title,
    //       content: template.content,
    //       state: template.state,
    //     });
    //   }
    // }

    const document = await this.documentRepo.save(await this.documentRepo.create(data));
    const { data: userAuthList } = await this.authService.getUsersAuthInWiki(
      document.organizationId,
      document.wikiId,
      null
    );

    await Promise.all([
      ...userAuthList
        .filter((userAuth) => userAuth.userId !== user.id)
        .map((userAuth) => {
          return this.authService.createOrUpdateAuth(userAuth.userId, {
            auth: userAuth.auth,
            organizationId: document.organizationId,
            wikiId: document.wikiId,
            documentId: document.id,
          });
        }),
      this.authService.createOrUpdateAuth(user.id, {
        auth: AuthEnum.creator,
        organizationId: document.organizationId,
        wikiId: document.wikiId,
        documentId: document.id,
      }),
    ]);

    return instanceToPlain(document);
  }
}