import { ApiProperty } from '@nestjs/swagger';
import { AuthEnum } from '../../constant/index';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthDto {
  @IsString({ message: '权限类型类型错误（正确类型为：String）' })
  @IsNotEmpty({ message: '权限类型不能为空' })
  @ApiProperty({ description: '权限类型' })
  auth: AuthEnum;

  @IsString({ message: '组织 Id 类型错误（正确类型为：String）' })
  @IsNotEmpty({ message: '组织 Id 不能为空' })
  @ApiProperty({ description: '组织 Id' })
  organizationId: string;

  @IsString({ message: '知识库 Id 类型错误（正确类型为：String）' })
  @IsOptional()
  @ApiProperty({ description: '知识库 Id' })
  wikiId: string;

  @IsString({ message: '文档 Id 类型错误（正确类型为：String）' })
  @IsOptional()
  @ApiProperty({ description: '文档 Id' })
  documentId: string;
}

export class OperateUserAuthDto {
  @IsString()
  @ApiProperty({ description: '用户权限' })
  readonly userAuth: AuthEnum;

  @IsString()
  @ApiProperty({ description: '用户名称' })
  readonly userName: string;
}
