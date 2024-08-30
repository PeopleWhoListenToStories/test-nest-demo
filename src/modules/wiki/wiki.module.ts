import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WikiEntity } from '~/modules/wiki/wiki.entity';
import { WikiService } from '~/modules/wiki/wiki.service';
import { WikiController } from '~/modules/wiki/wiki.controller';
import { AuthModule } from '~/modules/auth/auth.module';
import { UserModule } from '~/modules/user/user.module';
import { DocumentModule } from '~/modules/document/document.module';
import { OrganizationModule } from '~/modules/organization/organization.module';
import { ViewModule } from '~/modules/view/view.module';

// import { WikiController } from '@controllers/wiki.controller';
// import { WikiEntity } from '@entities/wiki.entity';
// import { AuthModule } from '@modules/auth.module';
// import { DocumentModule } from '@modules/document.module';
// import { MessageModule } from '@modules/message.module';
// import { OrganizationModule } from '@modules/organization.module';
// import { StarModule } from '@modules/star.module';
// import { UserModule } from '@modules/user.module';
// import { WikiService } from '@services/wiki.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WikiEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => DocumentModule),
    // forwardRef(() => MessageModule),
    forwardRef(() => ViewModule),
    // forwardRef(() => StarModule),
    forwardRef(() => OrganizationModule),
  ],
  providers: [WikiService],
  exports: [WikiService],
  controllers: [WikiController],
})
export class WikiModule {}
