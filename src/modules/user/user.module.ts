import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { AuthModule } from '~/modules/auth/auth.module'
import { UserService } from '~/modules/user/user.service'
import { UserController } from '~/modules/user/user.controller'
import { UserEntity } from '~/modules/user/user.entity'
import { OrganizationModule } from '~/modules/organization/organization.module'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule, forwardRef(() => AuthModule), forwardRef(() => OrganizationModule), HttpModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
