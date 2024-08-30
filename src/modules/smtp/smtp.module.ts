import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '~/modules/auth/auth.module'
import { SettingModule } from '~/modules/setting/setting.module'
import { SMTPService } from '~/modules/smtp/smtp.service'
import { SMTPController } from '~/modules/smtp/smtp.controller'
import { SMTP } from '~/modules/smtp/smtp.entity'

@Module({
  imports: [TypeOrmModule.forFeature([SMTP]), SettingModule, AuthModule],
  exports: [SMTPService],
  controllers: [SMTPController],
  providers: [SMTPService],
})
export class SMTPModule {}
