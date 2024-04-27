import { Controller, HttpStatus,  HttpCode, Post,  Body,  UseInterceptors, ClassSerializerInterceptor, UseGuards, } from '@nestjs/common'
import { ApiHeader, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { Roles } from '../../guard/roles.guard'
import { JwtAuthGuard } from '../../guard/jwt-auth.guard'
import { UserDTO, WxLoginDTO } from '../user/user.entity'

@ApiTags('Auth 模块')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   * @param user
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('login')
  @ApiOperation({
    tags: ['Auth'],
    summary: '登录',
  })
  @ApiResponse({ status: 200, description: '登录成功' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() user: UserDTO) {
    const res = await this.authService.login(user)
    return res
  }

  /**
   * 微信用户登录
   * @param user
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('wx-login')
  @ApiOperation({
    tags: ['Auth'],
    summary: '微信用户登录',
  })
  @ApiResponse({ status: 200, description: '微信用户登录成功' })
  @HttpCode(HttpStatus.OK)
  async wxLogin(@Body() user: WxLoginDTO) {
    const res = await this.authService.wxLogin(user)
    return res
  }

  /**
   * 校验当前是否是管理员
   * @param user
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('admin')
  @ApiOperation({
    tags: ['Auth'],
    summary: '校验当前是否是管理员',
  })
  @ApiResponse({ status: 200, description: '成功' })
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @ApiHeader({
    name: 'Authoriation',
    required: true,
    description: '本次请求请带上token',
  })
  @HttpCode(HttpStatus.OK)
  createBook() {
    return this.authService.checkAdmin()
  }
}
