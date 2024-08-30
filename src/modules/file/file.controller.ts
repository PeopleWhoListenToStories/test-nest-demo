import { Controller, Post, Get, Delete, Param, Query, UseInterceptors, UploadedFile, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiResponse, ApiOperation, ApiHeader } from '@nestjs/swagger'
import { JwtAuthGuard } from '~/guard/jwt-auth.guard'
import { RolesGuard, Roles } from '~/guard/roles.guard'
import { FileService } from '~/modules/file/file.service'
import { File } from '~/modules/file/file.entity'

@ApiTags('File')
@Controller('file')
@UseGuards(RolesGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * 上传文件
   * @param file
   */
  @ApiOperation({ summary: '上传文件' })
  @ApiResponse({ status: 200, description: '上传文件', type: [File] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiHeader({
    name: 'Authoriation',
    required: true,
    description: '本次请求请带上token',
  })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fieldSize: 50 * 1024 * 1024,
      },
    }),
  )
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  uploadFile(@UploadedFile() file, @Query('unique') unique) {
    return this.fileService.uploadFile(file, unique)
  }

  /**
   * 获取所有文件
   */
  @ApiOperation({
    summary: '获取所有文件',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() queryParam) {
    return this.fileService.findAll(queryParam)
  }

  /**
   * 获取指定文件
   * @param id
   */
  @ApiOperation({
    summary: '获取指定文件',
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') id) {
    return this.fileService.findById(id)
  }

  /**
   * 删除文件
   * @param id
   */
  @ApiOperation({
    summary: '删除指定文件',
  })
  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteById(@Param('id') id) {
    return this.fileService.deleteById(id)
  }
}
