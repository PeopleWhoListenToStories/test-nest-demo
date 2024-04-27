import { Module, forwardRef } from '@nestjs/common'
import { AuthService } from './auth.service'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './jwt.strategy'

import { config as envConfig } from '../../../config/env'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthEntity } from './auth.entity'

const passModule = PassportModule.register({ defaultStrategy: 'jwt' })
const jwtModule = JwtModule.register({
  secret: 'xulai',
  signOptions: { expiresIn: envConfig.SIGN_EXPIRES_IN || '1h' },
})

@Module({
  imports: [TypeOrmModule.forFeature([AuthEntity]), forwardRef(() => UserModule), forwardRef(() => passModule), forwardRef(() => jwtModule)],
  // providers: [AuthService, JwtStrategy],
  // exports: [AuthService, passModule, jwtModule],
  // controllers: [AuthController],
  // imports: [UserModule, passModule, jwtModule],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, passModule, jwtModule],
})
export class AuthModule {}
