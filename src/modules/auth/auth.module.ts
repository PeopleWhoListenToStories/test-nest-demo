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

import { getConfig } from '~/config';

const config = getConfig();
const jwtConfig = config.jwt as {
  secretKey: string;
  expiresIn: string;
};

const passModule = PassportModule.register({ defaultStrategy: 'jwt' })
const jwtModule = JwtModule.register({
  secret: jwtConfig.secretKey,
  signOptions: { expiresIn: jwtConfig.expiresIn },
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
