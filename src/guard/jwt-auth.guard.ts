import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

// import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
// import { AuthGuard } from '@nestjs/passport'

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   getRequest(context: ExecutionContext) {
//     const ctx = context.switchToHttp()
//     const request = ctx.getRequest()
//     return request
//   }

//   handleRequest<User>(err, user: User): User {
//   console.log(`%c 💍 🚀 : JwtAuthGuard -> classJwtAuthGuardextendsAuthGuard -> err `, `font-size:14px;background-color:#e8bfd3;color:black;`, err);
//   console.log(`%c 🌦️ 🚀 : JwtAuthGuard -> classJwtAuthGuardextendsAuthGuard -> user `, `font-size:14px;background-color:#f9792b;color:white;`, user);
//     if (err || !user) {
//       throw new UnauthorizedException('身份验证失败')
//     }

//     return user 
//   }
// }
