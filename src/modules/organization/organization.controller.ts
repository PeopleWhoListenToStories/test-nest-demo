import { Controller, Request, Body, UseInterceptors, ClassSerializerInterceptor, Post, HttpStatus, HttpCode, UseGuards, Get, Param, Delete, Query, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";

import { IPagination } from "../../constant";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { CreateOrganizationDto } from './organization.dto'
import { OrganizationService } from "./organization.service";
import { OperateUserAuthDto } from "../auth/auth.dto";

@ApiTags('Organization 模块')
@Controller('organization')
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * 获取组织详情
   * @param req
   * @returns
   */
  @ApiOperation({ tags: ['Organization'], summary: '获取组织详情' })
  @ApiParam({ name: 'id', type: String, description: 'the organization ID ', required: true })
  @Get('/detail/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getOrganizationDetail(@Request() req, @Param('id') id: string) {
    return await this.organizationService.getOrganizationDetail(req.user, id);
  }
  
  /**
   * 获取用户个人组织
   * @param req
   * @returns
   */
  @ApiOperation({ tags: ['Organization'], summary: '获取用户个人组织' })
  @Get('/personal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPersonalOrganization(@Request() req) {
    return await this.organizationService.getPersonalOrganization(req.user);
  }

  /**
   * 获取用户除个人组织外可访问的组织
   * @param user
   */
  @ApiOperation({ tags: ['Organization'], summary: '获取用户除个人组织外可访问的组织' })
  @Get('/list/personal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserOrganizations(@Request() req) {
    return await this.organizationService.getUserOrganizations(req.user);
  }

  /**
   * 创建组织
   * @param req
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Organization'], summary: '创建组织' })
  @ApiBody({ type: CreateOrganizationDto, description: 'the organization data' })
  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async createOrganization(@Request() req, @Body() organizationDto: CreateOrganizationDto) {
    return this.organizationService.createOrganization(req.user, organizationDto)
  }

  /**
   * 更新组织信息
   * @param req
   * @param id
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Organization'], summary: '更新组织信息' })
  @ApiBody({ type: CreateOrganizationDto, description: 'the organization data' })
  @Post('/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async updateOrganization(@Request() req, @Param('id') id, @Body() dto: CreateOrganizationDto) {
    return await this.organizationService.updateOrganization(req.user, id, dto);
  }
  
  /**
   * 删除组织
   * @param req
   * @param id
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ tags: ['Organization'], summary: '删除组织' })
  @ApiParam({ name: 'id', type: String, description: 'the organization ID ', required: true })
  @Delete('/delete/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteWiki(@Request() req, @Param('id') id) {
    return await this.organizationService.deleteOrganization(req.user, id);
  }

  /**
   * 获取组织成员
   * @param req
   * @returns
   */
  @ApiOperation({ tags: ['Organization'], summary: '获取组织成员' })
  @ApiQuery({ name: 'pageSize', type: Number, required: true, description: 'the pageSize' })
  @ApiQuery({ name: 'page', type: Number, required: true, description: 'the page' })
  @ApiParam({ name: 'id', type: String, description: 'the organization ID ', required: true })
  @Get('/member/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async getMembers(@Request() req, @Param('id') id, @Query() pagination: IPagination) {
    return await this.organizationService.getMembers(req.user, id, pagination);
  }

  /**
   * 添加组织成员
   * 只有管理员可操作
   * @param req
   * @param id
   * @param dto
   * @returns
   */
  @ApiOperation({ tags: ['Organization'], summary: '添加组织成员-只有管理员可以操作' })
  @ApiParam({ name: 'id', type: String, description: 'the organization ID ', required: true })
  @ApiBody({ type: OperateUserAuthDto, description: 'the organization data' })
  @Post('member/:id/add')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async addMember(@Request() req, @Param('id') id, @Body() dto: OperateUserAuthDto) {
    return await this.organizationService.addMember(req.user, id, dto);
  }
  
  /**
   * 更新组织成员（一般为角色操作）
   * 只有管理员可操作
   * @param req
   * @param id
   * @param dto
   * @returns
   */
  @ApiOperation({ summary: '更新组织成员（一般为角色操作）- 只有管理员可以操作' })
  @ApiParam({ name: 'id', type: String, description: 'the organization ID ', required: true })
  @ApiBody({ type: OperateUserAuthDto, description: 'the organization data' })
  @Patch('member/:id/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async updateMember(@Request() req, @Param('id') id, @Body() dto: OperateUserAuthDto) {
    return await this.organizationService.updateMember(req.user, id, dto);
  }
  
  /**
   * 删除组织成员
   * 只有管理员可操作
   * @param req
   * @param id
   * @param dto
   * @returns
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: '删除组织成员-只有管理员可以操作' })
  @ApiParam({ name: 'id', type: String, description: 'the organization ID ', required: true })
  @ApiBody({ type: OperateUserAuthDto, description: 'the organization data' })
  @Delete('member/:id/delete')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  async deleteMember(@Request() req, @Param('id') id, @Body() dto: OperateUserAuthDto) {
    return await this.organizationService.deleteMember(req.user, id, dto);
  }
}