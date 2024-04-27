import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from '../auth/auth.module'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserEntity } from './user.entity'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule, forwardRef(() => AuthModule), HttpModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
