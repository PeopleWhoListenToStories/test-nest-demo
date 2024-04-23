import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `安和桥间奏一响，路边的狗听了都有遗憾～ http://img.leixu.live/2023-10-09/Erhu-logo.jpeg`;
  }
}
