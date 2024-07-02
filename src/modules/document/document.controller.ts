import { Controller, Get, Request, Query, Param, HttpCode, HttpStatus, Body, Post, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../guard/jwt-auth.guard';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './create-document.dto';


@ApiTags('Document 模块')
@Controller('document')
@ApiBearerAuth()
// @UseGuards(DocumentStatusGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * 搜索文档
   * @param req
   * @param keyword
   * @returns
   */
  @ApiOperation({ summary: '搜索文档' })
  @ApiResponse({ status: 200, description: '搜索文档' })
  @Get('')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async search (@Request() req, @Query('organizationId') organizationId, @Query('keyword') keyword) {
    return await this.documentService.search(req.user, organizationId, keyword);
  }

  /**
   * 新建文档
   */
  @ApiOperation({ summary: '新建文档' })
  @ApiResponse({ status: 200, description: '新建文档' })
  @ApiBody({ type: CreateDocumentDto, description: 'the document data' })
  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async createDocument (@Request() req, @Body() dto: CreateDocumentDto) {
    return await this.documentService.createDocument(req.user, dto);
  }
}

