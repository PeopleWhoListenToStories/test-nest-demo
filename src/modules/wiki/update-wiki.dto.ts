import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateWikiDto {
  @IsString({ message: '知识库名称类型错误（正确类型为：String）' })
  @IsNotEmpty({ message: '知识库名称不能为空' })
  @MinLength(1, { message: '知识库名称至少1个字符' })
  @MaxLength(20, { message: '知识库名称最多20个字符' })
  @IsOptional()
  @ApiProperty({ description: '知识库名称' })
  readonly name: string;

  @IsString({ message: '知识库描述类型错误（正确类型为：String）' })
  @IsNotEmpty({ message: '知识库描述不能为空' })
  @MinLength(1, { message: '知识库描述至少1个字符' })
  @IsOptional()
  @ApiProperty({ description: '知识库描述' })
  description: string;

  @IsString({ message: '知识库封面类型错误（正确类型为：String）' })
  @IsOptional()
  @ApiProperty({ description: '知识库头像' })
  readonly cover?: string;
}
