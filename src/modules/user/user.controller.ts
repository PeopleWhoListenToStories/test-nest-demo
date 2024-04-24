import { Controller, Get, HttpStatus, HttpCode, Post, Query, Body, Request, UseGuards, UseInterceptors, HttpException, ClassSerializerInterceptor } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ApiTags, ApiResponse, ApiOperation, ApiHeader } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.guard'
import { UserService } from './user.service'
import { User } from './user.entity'

@ApiTags('User 模块')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,

    private readonly jwtService: JwtService,
  ) {}

  @ApiResponse({ status: 200, description: '获取用户列表', type: [User] })
  @ApiResponse({ status: 403, description: '无权获取用户列表' })
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  @ApiOperation({
    tags: ['User'],
    summary: '获取用户列表',
  })
  @Roles('admin')
  @ApiHeader({
    name: 'Authoriation',
    required: true,
    description: '本次请求请带上token',
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query) {
    return this.userService.findAll(query)
  }

  /**
   * 用户注册
   * @param user
   */
  @ApiResponse({ status: 200, description: '创建用户', type: [User] })
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('register')
  @ApiOperation({
    tags: ['User'],
    summary: '注册用户',
  })
  @ApiHeader({
    name: 'Authoriation',
    required: true,
    description: '本次请求请带上token',
  })
  @HttpCode(HttpStatus.OK)
  async register(@Body() user: Partial<User>): Promise<User> {
    const d = await this.userService.createUser(user)
    return d
  }

  async checkPermission(req, user) {
    let token = req.headers.authorization

    if (!token) {
      throw new HttpException('未认证', HttpStatus.UNAUTHORIZED)
    }

    if (/Bearer/.test(token)) {
      // 不需要 Bearer，否则验证失败
      token = token.split(' ').pop()
    }
    const tokenUser = this.jwtService.decode(token) as User
    const id = tokenUser.id

    if (!id) {
      throw new HttpException('未认证', HttpStatus.UNAUTHORIZED)
    }

    const exist = await this.userService.findById(id)
    if (exist.id !== user.id && exist.role !== 'admin') {
      throw new HttpException('无权处理', HttpStatus.FORBIDDEN)
    }
  }

  /**
   * 用户更新
   * @param user
   */
  @ApiResponse({ status: 200, description: '更新用户成功', type: [User] })
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('update')
  @ApiOperation({
    tags: ['User'],
    summary: '用户更新',
  })
  @ApiHeader({
    name: 'Authoriation',
    required: true,
    description: '本次请求请带上token',
  })
  @HttpCode(HttpStatus.OK)
  async update(@Request() req, @Body() user: Partial<User>): Promise<User> {
    await this.checkPermission(req, user)
    const d = await this.userService.updateById(user.id, user)
    return d
  }

  /**
   * 更新用户密码
   * @param user
   */
  @ApiResponse({ status: 200, description: '更新密码成功', type: [User] })
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('password')
  @ApiOperation({
    tags: ['User'],
    summary: '更新用户密码',
  })
  @ApiHeader({
    name: 'Authoriation',
    required: true,
    description: '本次请求请带上token',
  })
  @HttpCode(HttpStatus.OK)
  async updatePassword(@Request() req, @Body() user: Partial<User>): Promise<User> {
    await this.checkPermission(req, user)
    const d = await this.userService.updatePassword(user.id, user)
    return d
  }
}
