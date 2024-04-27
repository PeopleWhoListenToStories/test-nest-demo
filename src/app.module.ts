// import path from 'path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
// import { ServeStaticModule } from '@nestjs/serve-static'
import { AppController } from './app.controller'
// import { SocketModule } from './socket/socket.module'
import { AppService } from './app.service';

// 配置文件
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { file: envFilePath, config: envConfig } = require('../config/env')

// 定时任务模块
// import { TasksModule } from './modules/tasks/task.module'

// 设置模块
import { SettingModule } from './modules/setting/setting.module'
import { Setting } from './modules/setting/setting.entity'

// 文件模块
import { FileModule } from './modules/file/file.module'
import { File } from './modules/file/file.entity'

// 邮件模块
import { SMTPModule } from './modules/smtp/smtp.module'
import { SMTP } from './modules/smtp/smtp.entity'

// 短信模块
import { SmsModule } from './modules/sms/sms.module'
import { Sms } from './modules/sms/sms.entity'

// 鉴权模块
import { AuthModule } from './modules/auth/auth.module'
import { AuthEntity } from './modules/auth/auth.entity';

// 用户模块
import { UserModule } from './modules/user/user.module'
import { UserEntity } from './modules/user/user.entity'

// 组织模块
import { OrganizationModule } from './modules/organization/organization.module';
import { OrganizationEntity } from './modules/organization/organization.entity'

// wiki模块
import { WikiModule } from './modules/wiki/wiki.module';
import { WikiEntity } from './modules/wiki/wiki.entity'

// 文档模块
import { DocumentModule } from './modules/document/document.module'
import { Document } from './modules/document/document.entity'

@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: path.join(__dirname, '../', 'client/dist'),
    // }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [envFilePath] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        entities: [Setting, File, SMTP, Sms, AuthEntity, UserEntity, OrganizationEntity, WikiEntity, Document],
        host: configService.get('DB_HOST', envConfig.DB_HOST),
        port: configService.get<number>('DB_PORT', envConfig.DB_PORT),
        username: configService.get('DB_USER', envConfig.DB_USER),
        password: configService.get('DB_PASSWD', envConfig.DB_PASSWD),
        database: configService.get('DB_DATABASE', envConfig.DB_DATABASE),
        charset: 'utf8mb4',
        timezone: '+08:00',
        // migrationsRun: true,
        synchronize: true,
      }),
    }),
    SettingModule,
    FileModule,
    SMTPModule,
    SmsModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    WikiModule,
    DocumentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
