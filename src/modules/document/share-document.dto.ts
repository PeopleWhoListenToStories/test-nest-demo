import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ShareDocumentDto {
  @IsString({ message: '文档分享密码类型错误（正确类型为：String）' })
  @IsOptional()
  @ApiProperty({ description: '文档分享密码' })
  sharePassword: string;
}
