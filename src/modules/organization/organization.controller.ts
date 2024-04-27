import { Controller, Request, Body, UseInterceptors, ClassSerializerInterceptor, Post, HttpStatus, HttpCode, UseGuards, Get, Param, Delete, Query, Patch } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { IPagination } from "../../constant";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { CreateOrganizationDto } from './organization.dto'
import { OrganizationService } from "./organization.service";
import { OperateUserAuthDto } from "../auth/auth.dto";

@ApiTags('Organization 模块')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * 获取组织详情
   * @param req
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '获取组织详情' })
  @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  @Get('/detail')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getOrganizationDetail(@Request() req, @Param('id') id) {
    return await this.organizationService.getOrganizationDetail(req.user, id);
  }
  
  /**
   * 获取用户个人组织
   * @param req
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '获取用户个人组织' })
  @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  @Get('/personal')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getPersonalOrganization(@Request() req) {
    return await this.organizationService.getPersonalOrganization(req.user);
  }

  /**
   * 获取用户除个人组织外可访问的组织
   * @param user
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '获取用户除个人组织外可访问的组织' })
  @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  @Get('/list/personal')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getUserOrganizations(@Request() req) {
    return await this.organizationService.getUserOrganizations(req.user);
  }

  /**
   * 创建组织
   * @param req
   * @param dto
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '创建组织' })
  @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  @Post('/create')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async createOrganization(@Request() req, @Body() dto: CreateOrganizationDto) {
    return this.organizationService.createOrganization(req.user, dto)
  }

  /**
   * 更新组织信息
   * @param req
   * @param id
   * @param dto
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '更新组织信息' })
  @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  @Post('/update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateOrganization(@Request() req, @Param('id') id, @Body() dto: CreateOrganizationDto) {
    return await this.organizationService.updateOrganization(req.user, id, dto);
  }
  
  // /**
  //  * 删除组织
  //  * @param req
  //  * @param id
  //  * @returns
  //  */
  // @UseInterceptors(ClassSerializerInterceptor)
  // @ApiOperation({ summary: '删除组织' })
  // @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  // @Delete('/delete/:id')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async deleteWiki(@Request() req, @Param('id') id) {
  //   return await this.organizationService.deleteOrganization(req.user, id);
  // }

  /**
   * 获取组织成员
   * @param req
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '获取组织成员' })
  @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  @Get('/member/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getMembers(@Request() req, @Param('id') id, @Query() pagination: IPagination) {
    return await this.organizationService.getMembers(req.user, id, pagination);
  }

  // /**
  //  * 添加组织成员
  //  * 只有管理员可操作
  //  * @param req
  //  * @param id
  //  * @param dto
  //  * @returns
  //  */
  // @UseInterceptors(ClassSerializerInterceptor)
  // @ApiOperation({ summary: '添加组织成员-只有管理员可以操作' })
  // @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  // @Post('member/:id/add')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async addMember(@Request() req, @Param('id') id, @Body() dto: OperateUserAuthDto) {
  //   return await this.organizationService.addMember(req.user, id, dto);
  // }
  
  // /**
  //  * 更新组织成员（一般为角色操作）
  //  * 只有管理员可操作
  //  * @param req
  //  * @param id
  //  * @param dto
  //  * @returns
  //  */
  // @UseInterceptors(ClassSerializerInterceptor)
  // @ApiOperation({ summary: '更新组织成员（一般为角色操作）- 只有管理员可以操作' })
  // @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  // @Patch('member/:id/update')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async updateMember(@Request() req, @Param('id') id, @Body() dto: OperateUserAuthDto) {
  //   return await this.organizationService.updateMember(req.user, id, dto);
  // }
  
  // /**
  //  * 删除组织成员
  //  * 只有管理员可操作
  //  * @param req
  //  * @param id
  //  * @param dto
  //  * @returns
  //  */
  // @UseInterceptors(ClassSerializerInterceptor)
  // @ApiOperation({ summary: '删除组织成员-只有管理员可以操作' })
  // @ApiHeader({ name: 'Authoriation', required: true, description: '本次请求请带上token', })
  // @Delete('member/:id/delete')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async deleteMember(@Request() req, @Param('id') id, @Body() dto: OperateUserAuthDto) {
  //   return await this.organizationService.deleteMember(req.user, id, dto);
  // }
}