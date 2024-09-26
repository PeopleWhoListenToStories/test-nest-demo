import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplateController } from '~/modules/template/template.controller';
import { TemplateEntity } from '~/modules/template/template.entity';
import { TemplateService } from '~/modules/template/template.service';
import { DocumentModule } from '~/modules/document/document.module';
// import { MessageModule } from '@modules/message.module';
import { UserModule } from '~/modules/user/user.module';
import { WikiModule } from '~/modules/wiki/wiki.module';

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
