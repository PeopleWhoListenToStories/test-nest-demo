import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplateController } from './template.controller';
import { TemplateEntity } from './template.entity';
import { DocumentModule } from '../document/document.module';
// import { MessageModule } from '@modules/message.module';
import { UserModule } from '../user/user.module';
import { WikiModule } from '../wiki/wiki.module';
import { TemplateService } from './template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => WikiModule),
    forwardRef(() => DocumentModule),
    // forwardRef(() => MessageModule),
  ],
  providers: [TemplateService],
  exports: [TemplateService],
  controllers: [TemplateController],
})
export class TemplateModule {}
