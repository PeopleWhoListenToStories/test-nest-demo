import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '~/guard/jwt-auth.guard'
import { RolesGuard, Roles } from '~/guard/roles.guard'
import { SMTP } from '~/modules/smtp/smtp.entity'
import { SMTPService } from '~/modules/smtp/smtp.service'

@ApiTags('Smtp')
@Controller('smtp')
@UseGuards(RolesGuard)
export class SMTPController {
  constructor(private readonly smtpService: SMTPService) {}

  /**
   * 发送邮件
   * @param data
   */
  @ApiOperation({ summary: '发送邮件' })
  @ApiResponse({ status: 200, description: '发送邮件', type: [SMTP] })
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  create(@Body() data) {
    return this.smtpService.create(data)
  }

  /**
   * 获取所有邮件记录
   */
  @ApiOperation({ summary: '获取所有邮件记录' })
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findAll(@Query() queryParam) {
    return this.smtpService.findAll(queryParam)
  }

  /**
   * 删除邮件记录
   * @param id
   */
  @ApiOperation({ summary: '获取所有邮件记录' })
  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteById(@Param('id') id) {
    return this.smtpService.deleteById(id)
  }
}
