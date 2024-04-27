import { Controller, Get, HttpStatus, HttpCode, Post,  Delete,  Patch, Param, Query, Body, UseGuards, } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RolesGuard, Roles } from '../../guard/roles.guard'
import { JwtAuthGuard } from '../../guard/jwt-auth.guard'
import { SmsService } from './sms.service'
import { Sms } from './sms.entity'

@ApiTags('Sms')
@Controller('Sms')
@UseGuards(RolesGuard)
export class SmsController {
  constructor(private readonly service: SmsService) {}

  /** description 添加手机号
   * @param
   */
  @ApiOperation({ summary: '添加发送短信的手机号' })
  @ApiResponse({
    status: 200,
    description: '创建每一条要发送短信的手机号',
    type: [Sms],
  })
  @Post('/mobile')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  createUserSms(@Body() data) {
    return this.service.createUserSms(data)
  }

  /**
   * description 删除手机号
   * @param queryParams
   * @returns
   */
  @ApiOperation({ summary: '删除发送短信的手机号' })
  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteMobile(@Param('id') id) {
    return this.service.deleteMobile(id)
  }

  /**
   * description 更新手机号
   * @param id
   * @returns data
   */
  @ApiOperation({ summary: '更新发送短信的手机号' })
  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateMobile(@Param('id') id, @Body() data) {
    return this.service.updateMobile(id, data)
  }

  /** description 查询手机号列表
   * @param
   */
  @ApiOperation({ summary: '查询发送短信的手机号列表' })
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() queryParams) {
    return this.service.findAll(queryParams)
  }
}
