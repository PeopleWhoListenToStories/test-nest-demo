import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `<br/><img style="width: 370px; height: 370px; border-radius: 50%;" src="http://img.leixu.live/2024-04-25/XiaoEErhu.jpg"><br/><br/>安和桥间奏一响，路边的狗听了都有遗憾～ <br/><img style="width: 100px; height: 100px; border-radius: 50%;" src="https://img.leixu.live/2023-10-09/Erhu-logo.jpeg"><br/>`;
  }
}
