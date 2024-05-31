import { Controller, Request, Param, ClassSerializerInterceptor, UseInterceptors, Get, HttpCode, HttpStatus, UseGuards, Post, Body, Patch, Delete, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'

import { TemplateDto } from './template.dto';
import { JwtAuthGuard } from '../../guard/jwt-auth.guard';
import { TemplateService } from './template.service';

@ApiTags('Template 模块')
@Controller('template')
@ApiBearerAuth()
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  /**
   * 获取公开模板
   */
  @ApiOperation({ tags: ['Template'], summary: '获取公开模板' })
  @ApiQuery({ name: 'pageSize', type: Number, required: true, description: 'the pageSize' })
  @ApiQuery({ name: 'page', type: Number, required: true, description: 'the page' })
  @Get('/public')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getPublicTemplates(@Query() qurey) {
    return this.templateService.getPublicTemplates(qurey);
  }

  /**
   * 获取个人创建模板
   */
  @ApiOperation({ tags: ['Template'], summary: '获取个人创建模板' })
  @ApiQuery({ name: 'pageSize', type: Number, required: true, description: 'the pageSize' })
  @ApiQuery({ name: 'page', type: Number, required: true, description: 'the page' })
  @Get('/own')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getOwnTemplates(@Request() req, @Query() qurey) {
    return this.templateService.getOwnTemplates(req.user, qurey);
  }

  /**
   * 新建模板
   */
  @ApiOperation({ tags: ['Template'], summary: '新建模板' })
  @ApiBody({ type: TemplateDto, description: 'the templateDto' })
  @Post('/add')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async create(@Request() req, @Body() dto: TemplateDto) {
    return await this.templateService.create(req.user, dto);
  }

  /**
   * 更新模板
   */
  @ApiOperation({ tags: ['Template'], summary: '更新模板' })
  @ApiBody({ type: TemplateDto, description: 'the templateDto' })
  @Patch('/update/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async updateTemplat(@Request() req, @Body() dto: TemplateDto & { id: string }) {
    return await this.templateService.updateTemplate(req.user, dto.id, dto);
  }

  /**
   * 获取模板详情
   */
  @ApiOperation({ tags: ['Template'], summary: '获取模板详情' })
  @ApiParam({ name: 'id', type: String, description: '模板ID' })
  @Get('/detail/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getTemplate(@Request() req, @Param('id') id) {
    return this.templateService.getTemplate(req.user, id);
  }

  /**
   * 删除模板
   */
  @ApiOperation({ tags: ['Template'], summary: '删除模板' })
  @ApiParam({ name: 'id', type: String, description: '模板ID' })
  @Delete('/delete/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async deleteTemplat(@Request() req, @Param('id') documentId) {
    return await this.templateService.deleteTemplate(req.user, documentId);
  }
}
