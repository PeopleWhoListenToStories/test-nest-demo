import { Controller, Request, Param, ClassSerializerInterceptor, UseInterceptors, Get, HttpCode, HttpStatus, UseGuards, Post, Body, Patch, Delete, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../../guard/jwt-auth.guard'
import { CheckWikiStatus, WikiStatusGuard } from '../../guard/wiki-status.guard'
import { WikiService } from './wiki.service'
import { CreateWikiDto } from './create-wiki.dto'
import { UpdateWikiDto } from './update-wiki.dto'
import { IPagination, WikiStatus } from 'src/constant'
import { OperateUserAuthDto } from '../auth/auth.dto'
import { ShareWikiDto } from './share-wiki.dto'

@ApiTags('Wiki 模块')
@Controller('wiki')
@ApiBearerAuth()
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  /**
   * 获取用户所有知识库（创建的、参与的）
   * @param req
   * @param pagination
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '获取用户所有知识库（创建的、参与的）' })
  @ApiParam({ name: 'organizationId', type: String, description: '组织ID' })
  @Get('list/all/:organizationId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getAllWikis(@Request() req, @Param('organizationId') organizationId) {
    return await this.wikiService.getAllWikis(req.user, organizationId)
  }

  /**
   * 获取用户拥有的知识库（一般是创建的，尚未实现知识库转移）
   * @param req
   * @param pagination
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '获取用户拥有的知识库（一般是创建的，尚未实现知识库转移）' })
  @ApiParam({ name: 'organizationId', type: String, description: '组织ID' })
  @Get('list/own/:organizationId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getOwnWikis(@Request() req, @Param('organizationId') organizationId) {
    return await this.wikiService.getOwnWikis(req.user, organizationId)
  }

  /**
   * 获取用户参与的知识库
   * @param req
   * @param pagination
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '获取用户参与的知识库' })
  @ApiParam({ name: 'organizationId', type: String, description: '组织ID' })
  @Get('list/join/:organizationId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getJoinWikis(@Request() req, @Param('organizationId') organizationId) {
    return await this.wikiService.getJoinWikis(req.user, organizationId)
  }

  /**
   * 新建知识库
   * @param req
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '新建知识库' })
  @ApiBody({ type: CreateWikiDto, description: 'the wiki data' })
  @Post('add')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  async register(@Request() req, @Body() dto: CreateWikiDto) {
    return await this.wikiService.createWiki(req.user, dto)
  }

  /**
   * 获取知识库首页文档（首页文档为自动创建）
   * @param req
   * @param wikiId
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '获取知识库首页文档（首页文档为自动创建）' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @Get('homedoc/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getWikiHomeDocument(@Request() req, @Param('id') wikiId) {
    return await this.wikiService.getWikiHomeDocument(req.user, wikiId)
  }

  /**
   * 获取知识库目录
   * @param req
   * @param wikiId
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '获取知识库目录' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @Get('docs/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getWikiDocs(@Request() req, @Param('id') wikiId) {
    return await this.wikiService.getWikiDocs(req.user, wikiId)
  }

  /**
   * 更新知识库目录（排序、父子关系）
   * @param req
   * @param wikiId
   * @param relations
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '更新知识库目录（排序、父子关系）' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @ApiBody({})
  @Patch('docs/:id/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async orderWikiDocs(@Body() relations) {
    return await this.wikiService.orderWikiDocs(relations)
  }

  /**
   * 获取知识库详情
   * @param req
   * @param wikiId
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '获取知识库详情' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getWikiDetail(@Request() req, @Param('id') wikiId) {
    return await this.wikiService.getWikiDetail(req.user, wikiId)
  }

  /**
   * 修改知识库
   * @param req
   * @param wikiId
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '修改知识库' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @ApiBody({ type: UpdateWikiDto, description: 'the wiki data' })
  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async updateWiki(@Request() req, @Param('id') wikiId, @Body() dto: UpdateWikiDto) {
    return await this.wikiService.updateWiki(req.user, wikiId, dto)
  }

  /**
   * 删除知识库
   * @param req
   * @param wikiId
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '删除知识库' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async deleteWiki(@Request() req, @Param('id') wikiId) {
    return await this.wikiService.deleteWiki(req.user, wikiId)
  }

  /**
   * 查看知识库成员
   * @param req
   * @param wikiId
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '查看知识库成员' })
  @ApiQuery({ name: 'pageSize', type: Number, required: true, description: 'the pageSize' })
  @ApiQuery({ name: 'page', type: Number, required: true, description: 'the page' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @Get('member/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getWikiUsers(@Request() req, @Param('id') wikiId, @Query() pagination: IPagination) {
    return await this.wikiService.getWikiUsers(req.user, wikiId, pagination)
  }

  /**
   * 添加知识库成员
   * @param req
   * @param wikiId
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '添加知识库成员' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @ApiBody({ type: OperateUserAuthDto, description: 'the OperateUserAuthDto' })
  @Post('member/:id/add')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async addWikiUser(@Request() req, @Param('id') wikiId, @Body() dto: OperateUserAuthDto) {
    return await this.wikiService.addWikiUser(req.user, wikiId, dto)
  }

  /**
   * 更新知识库成员（一般为角色操作）
   * @param req
   * @param wikiId
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '更新知识库成员（一般为角色操作）' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @ApiBody({ type: OperateUserAuthDto, description: 'the OperateUserAuthDto' })
  @Patch('member/:id/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async updateWikiUser(@Request() req, @Param('id') wikiId, @Body() dto: OperateUserAuthDto) {
    return await this.wikiService.updateWikiUser(req.user, wikiId, dto)
  }

  /**
   * 删除知识库成员
   * @param req
   * @param wikiId
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '删除知识库成员' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @ApiBody({ type: OperateUserAuthDto, description: 'the OperateUserAuthDto' })
  @Delete('member/:id/delete')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async deleteWikiUser(@Request() req, @Param('id') wikiId, @Body() dto: OperateUserAuthDto) {
    return await this.wikiService.deleteWikiUser(req.user, wikiId, dto)
  }

  /**
   * 分享（或关闭分享）知识库
   * @param req
   * @param wikiId
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Wiki'], summary: '分享（或关闭分享）知识库' })
  @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  @ApiBody({ type: ShareWikiDto, description: 'the ShareWikiDto' })
  @Post('share/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async toggleWorkspaceStatus(@Request() req, @Param('id') wikiId, @Body() dto: ShareWikiDto) {
    return await this.wikiService.shareWiki(req.user, wikiId, dto)
  }

  /**
   * 获取公开知识库首页文档
   * @param req
   * @param wikiId
   * @returns
   */
  // @ApiOperation({ tags: ['Wiki'], summary: '获取公开知识库首页文档' })
  // @ApiParam({ name: 'id', type: String, description: 'wikiId' })
  // @Get('/public/homedoc/:id')
  // @CheckWikiStatus(WikiStatus.public)
  // @UseGuards(JwtAuthGuard)
  // @UseInterceptors(ClassSerializerInterceptor)
  // @HttpCode(HttpStatus.OK)
  // async getWikiPublicHomeDocument(@Request() req, @Param('id') wikiId) {
  //   return await this.wikiService.getPublicWikiHomeDocument(wikiId);
  // }
}
