import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { UserEntity } from '~/modules/user/user.entity'

export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Array<string>>('roles', context.getHandler())
    if (!roles) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    let token = request.headers['Authorization']

    if (/Bearer/.test(token)) {
      // 不需要 Bearer 否则验证失败 请求必须携带 Authorization = `${'Bearer'} ${token}`
      token = token.split(' ').pop()
    }
    const user = this.jwtService.decode(token) as UserEntity
    if (!user) {
      return false
    }
    const hasRole = roles.some((role) => role === user.role)
    return user && user.role && hasRole
  }
}
