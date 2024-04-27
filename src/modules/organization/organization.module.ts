import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationController } from './organization.controller';
import { OrganizationEntity } from './organization.entity';
import { AuthModule } from '../auth/auth.module';
// import { MessageModule } from '@modules/message.module';
import { UserModule } from '../user/user.module';
// import { WikiModule } from '../wiki/wiki.module';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity]),
    forwardRef(() => UserModule),
    // forwardRef(() => MessageModule),
    forwardRef(() => AuthModule),
    // forwardRef(() => WikiModule),
  ],
  providers: [OrganizationService],
  exports: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
