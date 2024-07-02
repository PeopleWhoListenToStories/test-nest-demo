import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty({ message: '组织Id不能为空' })
  @ApiProperty({ description: '组织Id' })
  readonly organizationId: string;

  @IsNotEmpty({ message: '知识库Id不能为空' })
  @ApiProperty({ description: '知识库Id' })
  readonly wikiId: string;

  @IsOptional()
  readonly parentDocumentId?: string;

  @IsString({ message: '文档名称类型错误（正确类型为：String）' })
  @IsNotEmpty({ message: '文档名称不能为空' })
  @MinLength(1, { message: '文档名称至少1个字符' })
  @IsOptional()
  @ApiProperty({ description: '文档名称' })
  readonly title?: string;

  @IsOptional()
  @ApiProperty({ description: '模版id' })
  readonly templateId?: string;

  @IsOptional()
  @ApiProperty({ description: '模版内容' })
  readonly content?: string;

  @IsOptional()
  @ApiProperty({ description: '模版数据流' })
  state?: Buffer;
}
