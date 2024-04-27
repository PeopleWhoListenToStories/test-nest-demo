/**
 * 用户状态枚举
 */
export enum UserStatus {
  normal = 'normal',
  locked = 'locked',
}

/**
 * 用户数据定义
 */
export interface IUser {
  id: string;
  name: string;
  password?: string;
  avatar?: string;
  email?: string;
  status: UserStatus;
  isSystemAdmin?: boolean;
}

export enum AuthEnum {
  creator = 'creator',
  admin = 'admin',
  member = 'member',
  noAccess = 'noAccess',
}

/**
 * 组织数据定义
 */
export interface IOrganization {
  id: string;
  name: string;
  description: string;
  logo: string;
  createUserId: IUser['id'];
  isPersonal: boolean;
}

/**
 * 知识库状态枚举
 */
export enum WikiStatus {
  private = "private",
  public = "public"
}

/**
* 知识库数据定义
*/
export interface IWiki {
  id: string;
  organizationId: IOrganization['id'];
  name: string;
  avatar: string;
  description: string;
  createUserId: IUser['id'];
  createUser: IUser;
  status: WikiStatus;
  homeDocumentId: IDocument['id'];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 文档状态枚举
 */
export enum DocumentStatus {
  private = 'private',
  public = 'public',
}

/**
 * 文档数据定义
 */
export interface IDocument {
  id: string;
  organizationId: IOrganization['id'];
  wikiId: IWiki['id'];
  isWikiHome: boolean;
  createUserId: IUser['id'];
  createUser: IUser;
  parentDocumentId?: IDocument['id'];
  title: string;
  content: string;
  state: Uint8Array;
  status: DocumentStatus;
  views: number;
  sharePassword?: string;
  createdAt: Date;
  updatedAt: Date;
  children?: IDocument[];
}

export type IPagination = {
  page: number;
  pageSize: number;
};

type MessageType = 'toOrganization' | 'toWiki' | 'toDocument';

export const buildMessageURL = ( type: MessageType ): ((arg: { organizationId: IOrganization['id']; wikiId?: IWiki['id']; documentId?: IDocument['id'] }) => string) => {
  switch (type) {
    case 'toDocument':
      return ({ organizationId, wikiId, documentId }) => {
        return `/app/org/${organizationId}/wiki/${wikiId}/doc/${documentId}`;
      };

    case 'toWiki':
      return ({ organizationId, wikiId }) => {
        return `/app/org/${organizationId}/wiki/${wikiId}`;
      };

    case 'toOrganization':
      return ({ organizationId }) => {
        return `/app/org/${organizationId}`;
      };

    default:
      throw new Error() as never;
  }
};

export const DEFAULT_WIKI_AVATAR = 'https://wipi.oss-cn-shanghai.aliyuncs.com/2022-07-20/default7-97.png';

export const WIKI_AVATARS = [DEFAULT_WIKI_AVATAR];

export const ORGANIZATION_LOGOS = [DEFAULT_WIKI_AVATAR];

export const DOCUMENT_COVERS = [
  'https://wipi.oss-cn-shanghai.aliyuncs.com/2022-07-20/photo-1562380156-9a99cd92484c.avif',
  'https://wipi.oss-cn-shanghai.aliyuncs.com/2022-07-20/photo-1510935813936-763eb6fbc613.avif',
  'https://wipi.oss-cn-shanghai.aliyuncs.com/2022-07-20/photo-1517697471339-4aa32003c11a.avif',
  'https://wipi.oss-cn-shanghai.aliyuncs.com/2022-07-20/photo-1622737133809-d95047b9e673.avif',
  'https://wipi.oss-cn-shanghai.aliyuncs.com/2022-07-20/photo-1547891654-e66ed7ebb968.avif',
  'https://wipi.oss-cn-shanghai.aliyuncs.com/2022-07-20/photo-1629461461750-ef5b81781bc2.avif',
];

export const EMPTY_DOCUMENT = {
  content: JSON.stringify({
    default: {
      type: 'doc',
      content: [{ type: 'title', content: [{ type: 'text', text: '' }] }],
    },
  }),
  state: Buffer.from(new Uint8Array([])),
};