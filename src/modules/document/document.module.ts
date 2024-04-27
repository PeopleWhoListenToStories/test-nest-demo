import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentController } from './document.controller'
import { Document } from './document.entity';
import { DocumentService } from './document.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    forwardRef(() => AuthModule),
    // forwardRef(() => ConfigModule),
    // forwardRef(() => UserModule),
    // forwardRef(() => WikiModule),
    // forwardRef(() => MessageModule),
    // forwardRef(() => TemplateModule),
    // forwardRef(() => StarModule),
    // forwardRef(() => ViewModule),
  ],
  providers: [DocumentService],
  exports: [DocumentService],
  controllers: [DocumentController],
})
export class DocumentModule {}