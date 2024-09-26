import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWikiDto {
  @IsNotEmpty({ message: '组织Id不能为空' })
  @ApiProperty({ description: '组织Id' })
  readonly organizationId: string;

  @IsString({ message: '知识库名称类型错误（正确类型为：String）' })
  @IsNotEmpty({ message: '知识库名称不能为空' })
  @MinLength(1, { message: '知识库名称至少1个字符' })
  @MaxLength(20, { message: '知识库名称最多20个字符' })
  @ApiProperty({ description: '知识库名称' })
  readonly name: string;

  @IsString({ message: '知识库描述类型错误（正确类型为：String）' })
  @ApiProperty({ description: '知识库描述' })
  description: string;

  @IsString({ message: '知识库头像类型错误（正确类型为：String）' })
  @ApiProperty({ description: '知识库头像' })
  @IsOptional()
  readonly cover?: string;
}
