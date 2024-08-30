import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request as RequestType } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UserEntity } from '../user/user.entity'
import { AuthService } from './auth.service'

import { getConfig } from '~/config';

const config = getConfig();
const jwtConfig = config.jwt as {
  secretKey: string;
  expiresIn: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(forwardRef(() => AuthService)) private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secretKey,
      ignoreExpiration: false,
      // jwtFromRequest: ExtractJwt.fromExtractors([
      //   (request: RequestType) => {
      //     const token = request?.cookies?.token
      //     return token
      //   },
      // ]),
    })
  }

  async validate(payload: UserEntity) {
    const user = await this.authService.validateUser(payload)

    if (!user) {
      throw new UnauthorizedException('身份验证失败')
    }
    return user
  }
}
