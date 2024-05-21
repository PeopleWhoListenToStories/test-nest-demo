import { Module, forwardRef } from '@nestjs/common'
// import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthEntity } from './auth.entity'
import { JwtStrategy } from './jwt.strategy'
// import { JwtAuthGuard } from '../../guard/jwt-auth.guard';

import { config as envConfig } from '../../../config/env'

const passModule = PassportModule.register({ defaultStrategy: 'jwt' })
const jwtModule = JwtModule.register({
  secret: envConfig.JWT_SECRET,
  signOptions: { expiresIn: envConfig.JWT_SIGN_EXPIRES_IN || '1h' },
})

@Module({
  imports: [TypeOrmModule.forFeature([AuthEntity]), forwardRef(() => UserModule), passModule, jwtModule],
  providers: [
    AuthService,
    JwtStrategy , 
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // }, // 全局注册
  ],
  controllers: [AuthController],
  exports: [AuthService, passModule, jwtModule],
})
export class AuthModule {}
