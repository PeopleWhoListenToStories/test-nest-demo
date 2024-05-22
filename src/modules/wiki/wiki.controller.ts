import { Controller, Request, Param, ClassSerializerInterceptor, UseInterceptors, Get, HttpCode, HttpStatus, UseGuards, Post, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { WikiService } from "./wiki.service";
import { CreateWikiDto } from "./create-wiki.dto";

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
    return await this.wikiService.getAllWikis(req.user, organizationId);
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
    return await this.wikiService.getOwnWikis(req.user, organizationId);
  }

  /**
   * 获取用户参与的知识库
   * @param req
   * @param pagination
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '获取用户参与的知识库' })
  @ApiParam({ name: 'organizationId', type: String, description: '组织ID' })
  @Get('list/join/:organizationId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getJoinWikis(@Request() req, @Param('organizationId') organizationId) {
    return await this.wikiService.getJoinWikis(req.user, organizationId);
  }

  /**
   * 新建知识库
   * @param req
   * @param dto
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '新建知识库' })
  @ApiBody({ type: CreateWikiDto, description: 'the wiki data' })
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async register(@Request() req, @Body() dto: CreateWikiDto) {
    return await this.wikiService.createWiki(req.user, dto);
  }
}