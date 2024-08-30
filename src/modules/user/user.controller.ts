import { Controller, Get, HttpStatus, HttpCode, Post, Query, Body, Request, UseGuards, UseInterceptors, HttpException, ClassSerializerInterceptor, Req } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ApiTags, ApiResponse, ApiOperation, ApiHeader, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '~/guard/jwt-auth.guard'
import { Roles } from '~/guard/roles.guard'
import { UserService } from '~/modules/user/user.service'
import { UserEntity } from '~/modules/user/user.entity'

@ApiTags('User 模块')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,

    private readonly jwtService: JwtService,
  ) {}

  @ApiResponse({ status: 200, description: '获取用户列表', type: [UserEntity] })
  @ApiResponse({ status: 403, description: '无权获取用户列表' })
  @ApiBearerAuth()
  @Get('/list')
  @ApiOperation({
    tags: ['User'],
    summary: '获取用户列表',
  })
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query) {
    return this.userService.findAll(query)
  }

  /**
   * 用户注册
   * @param user
   */
  @ApiResponse({ status: 200, description: '创建用户', type: [UserEntity] })
  @ApiBody({ type: UserEntity, description: 'the UserEntity '})
  @ApiBearerAuth()
  @Post('/register')
  @ApiOperation({ tags: ['User'], summary: '注册用户', })
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async register(@Body() user: Partial<UserEntity>): Promise<UserEntity> {
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
    const tokenUser = this.jwtService.decode(token) as UserEntity
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
  @ApiResponse({ status: 200, description: '更新用户成功', type: [UserEntity] })
  @ApiBody({ type: UserEntity, description: 'the UserEntity '})
  @ApiBearerAuth()
  @Post('/update')
  @ApiOperation({ tags: ['User'], summary: '用户更新' })
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async update(@Request() req, @Body() user: Partial<UserEntity>): Promise<UserEntity> {
    await this.checkPermission(req, user)
    const d = await this.userService.updateById(user.id, user)
    return d
  }

  /**
   * 更新用户密码
   * @param user
   */
  @ApiResponse({ status: 200, description: '更新用户密码', type: [UserEntity] })
  @ApiOperation({ tags: ['User'], summary: '更新用户密码' })
  @ApiBody({ type: UserEntity, description: 'the UserEntity '})
  @ApiBearerAuth()
  @Post('/password')
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async updatePassword(@Request() req, @Body() user: Partial<UserEntity>): Promise<UserEntity> {
    await this.checkPermission(req, user)
    const d = await this.userService.updatePassword(user.id, user)
    return d
  }

  /**
   * 获取用户信息
   */
  @ApiResponse({ status: 200, description: '获取用户信息', type: [UserEntity] })
  @ApiOperation({ tags: ['User'], summary: '获取用户信息' })
  @ApiBearerAuth()
  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserInfo(@Req() req) {
    return req.user
  }
}
