import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '~/modules/auth/auth.module'
import { UserModule } from '~/modules/user/user.module'
import { SettingService } from '~/modules/setting/setting.service'
import { SettingController } from '~/modules/setting/setting.controller'
import { Setting } from '~/modules/setting/setting.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Setting]), UserModule, AuthModule],
  exports: [SettingService],
  providers: [SettingService],
  controllers: [SettingController],
})
export class SettingModule {}
