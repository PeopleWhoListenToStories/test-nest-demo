import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';


import { DocumentController } from './document.controller'
import { Document } from '~/modules/document/document.entity';
import { DocumentService } from '~/modules/document/document.service';
import { AuthModule } from '~/modules/auth/auth.module';
import { WikiModule } from '~/modules/wiki/wiki.module';
import { UserModule } from '~/modules/user/user.module';
import { TemplateModule } from '~/modules/template/template.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    forwardRef(() => AuthModule),
    forwardRef(() => ConfigModule),
    forwardRef(() => UserModule),
    forwardRef(() => WikiModule),
    // forwardRef(() => MessageModule),
    forwardRef(() => TemplateModule),
    // forwardRef(() => StarModule),
    // forwardRef(() => ViewModule),
  ],
  providers: [DocumentService],
  exports: [DocumentService],
  controllers: [DocumentController],
})
export class DocumentModule {}