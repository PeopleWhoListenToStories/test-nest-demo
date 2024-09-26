import { ApiProperty } from '@nestjs/swagger'
import { IsOptional } from 'class-validator'
import { WikiStatus } from '~/constant'

export class ShareWikiDto {
  // 目标状态：公开或私有
  @IsOptional()
  @ApiProperty({ description: '目标状态：公开或私有' })
  nextStatus: WikiStatus

  // 公开的文档
  @IsOptional()
  @ApiProperty({ description: '公开的文档' })
  publicDocumentIds: Array<string>

  // 私有的文档
  @IsOptional()
  @ApiProperty({ description: '私有的文档' })
  privateDocumentIds: Array<string>
}
