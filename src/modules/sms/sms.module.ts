import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '~/modules/auth/auth.module'
import { SettingModule } from '~/modules/setting/setting.module'
import { SmsController } from '~/modules/sms/sms.controller'
import { SmsService } from '~/modules/sms/sms.service'
import { Sms } from '~/modules/sms/sms.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Sms]), AuthModule, SettingModule],
  exports: [SmsService],
  providers: [SmsService],
  controllers: [SmsController],
})
export class SmsModule {}
