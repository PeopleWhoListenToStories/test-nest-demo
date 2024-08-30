import { Inject, Module, forwardRef } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Cron, ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from 'nestjs-pino';
// import { ServeStaticModule } from '@nestjs/serve-static'
import { AppController } from '~/app.controller'
// import { SocketModule } from '~/socket/socket.module'
import { AppService } from '~/app.service';
import { getLogFileName, ONE_DAY } from '~/helpers/log.helper';
import { IS_PRODUCTION } from '~/helpers/env.helper';

import { getConfig } from '~/config';

import * as fs from 'fs-extra';
import * as path from 'path';
import pino from 'pino';

// 配置文件

// 定时任务模块
// import { TasksModule } from './modules/tasks/task.module'

// 设置模块
import { SettingModule } from '~/modules/setting/setting.module'
import { Setting } from '~/modules/setting/setting.entity'

// 文件模块
import { FileModule } from '~/modules/file/file.module'
import { File } from '~/modules/file/file.entity'

// 邮件模块
import { SMTPModule } from '~/modules/smtp/smtp.module'
import { SMTP } from '~/modules/smtp/smtp.entity'

// 短信模块
import { SmsModule } from '~/modules/sms/sms.module'
import { Sms } from '~/modules/sms/sms.entity'

// 鉴权模块
import { AuthModule } from '~/modules/auth/auth.module'
import { AuthEntity } from '~/modules/auth/auth.entity';

// 用户模块
import { UserModule } from '~/modules/user/user.module'
import { UserEntity } from '~/modules/user/user.entity'

// 组织模块
import { OrganizationModule } from '~/modules/organization/organization.module';
import { OrganizationEntity } from '~/modules/organization/organization.entity'

// wiki模块
import { WikiModule } from '~/modules/wiki/wiki.module';
import { WikiEntity } from '~/modules/wiki/wiki.entity'

// 文档模块
import { DocumentModule } from '~/modules/document/document.module'
import { Document } from '~/modules/document/document.entity'

// template模块
import { TemplateModule } from '~/modules/template/template.module'
import { TemplateEntity } from '~/modules/template/template.entity'

// view模块
import { ViewModule } from '~/modules/view/view.module'

const ENTITIES = [
  Setting, 
  File, 
  SMTP, 
  Sms, 
  AuthEntity, 
  UserEntity, 
  OrganizationEntity, 
  WikiEntity,
  Document, 
  ViewModule, 
  TemplateEntity,
  // DocumentEntity,
  // StarEntity,
  // CommentEntity,
  // MessageEntity,
  // SystemEntity,
];

const MODULES = [
  SettingModule,
  FileModule,
  SMTPModule,
  SmsModule,
  AuthModule,
  UserModule,
  OrganizationModule,
  WikiModule,
  DocumentModule,
  TemplateModule,
  ViewModule,
  // StarModule,
  // CommentModule,
  // MessageModule,
  // VerifyModule,
  // SystemModule,
];

@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: path.join(__dirname, '../', 'client/dist'),
    // }),
    ConfigModule.forRoot({
      cache: true,
      load: [getConfig],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    IS_PRODUCTION &&
    LoggerModule.forRoot({
      pinoHttp: {
        stream: pino.destination({
          dest: `./logs/${getLogFileName(new Date())}`,
          minLength: 4096,
          mkdir: true,
          sync: false,
        }),
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        entities: ENTITIES,
        keepConnectionAlive: true,
        ...configService.get('db.mysql'),
      }),
    }),
   ...MODULES,
  ].filter(Boolean),
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(
    @Inject(forwardRef(() => ConfigService))
    private readonly configService: ConfigService
  ) {}

  /**
   * 每天早上9点，清理日志
   */
  @Cron('0 0 9 * * *')
  deleteLog() {
    let retainDays = this.configService.get('server.logRetainDays');
    const startDate = new Date(new Date().valueOf() - retainDays * ONE_DAY).valueOf();

    do {
      const filepath = path.join(__dirname, '../logs', getLogFileName(startDate, retainDays));
      fs.removeSync(filepath);
      retainDays -= 1;
    } while (retainDays > 0);
  }
}
