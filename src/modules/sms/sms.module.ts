import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { SettingModule } from '../setting/setting.module'
import { SmsController } from './sms.controller'
import { SmsService } from './sms.service'
import { Sms } from './sms.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Sms]), AuthModule, SettingModule],
  exports: [SmsService],
  providers: [SmsService],
  controllers: [SmsController],
})
export class SmsModule {}
