import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { HttpResponseExceptionFilter } from './exceptions/http-response.exception';
import { ValidationPipe } from './pipes/validation.pipe';
import { HttpResponseTransformInterceptor } from './transforms/http-response.transform';
import { infoLogger } from './logger/index'

import { config as envConfig } from '../config/env'

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['warn', 'error'],
  });

  // app.enableCors({
  //   origin: envConfig.get('client.siteUrl'),
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   credentials: true,
  // });

  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  app.use(cookieParser());
  app.use(compression());
  // app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.useGlobalFilters(new HttpResponseExceptionFilter());
  app.useGlobalInterceptors(new HttpResponseTransformInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix(envConfig.SWAGGER_ENDPOINT_PREFIX || '/');

    // DocumentBuilder是一个辅助类，有助于结构的基本文件SwaggerModule。它包含几种方法，可用于设置诸如标题，描述，版本等属性。
    const options = new DocumentBuilder()
    .setTitle(envConfig.SWAGGER_UI_TITLE)
    .setDescription(envConfig.SWAGGER_UI_TITLE_DESC) // 文档介绍
    .setVersion(envConfig.SWAGGER_API_VERSION) // 文档版本
    .addBearerAuth()
    .addTag('') // 每个tag标签都可以对应着几个@ApiUseTags('用户,安全') 然后被ApiUseTags注释，字符串一致的都会变成同一个标签下的
    // .setBasePath(envConfig.SWAGGER_SETUP_HTTP)
    .build()
  // 为了创建完整的文档（具有定义的HTTP路由），我们使用类的createDocument()方法SwaggerModule。此方法带有两个参数，分别是应用程序实例和基本Swagger选项。
  const document = SwaggerModule.createDocument(app, options)
  // 最后一步是setup()。它依次接受（1）装入Swagger的路径，（2）应用程序实例, （3）描述Nest应用程序的文档。
  SwaggerModule.setup(envConfig.SWAGGER_SETUP_PATH, app, document, {
    // customCssUrl: `${envConfig.SWAGGER_CND_URL}/swagger-ui.css`,
    // customJs: `${envConfig.SWAGGER_CND_URL}/swagger-ui-bundle.js,
    // ${envConfig.SWAGGER_CND_URL}/swagger-ui-standalone-preset.js`,
    customCssUrl: ['https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.6.2/swagger-ui.css'],
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.0/swagger-ui-bundle.js',
      'https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.6.2/swagger-ui-standalone-preset.js',
    ],
    customSiteTitle: '',
    swaggerOptions: {
      explorer: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        active: true,
        theme: 'tomorrow-night',
      },
    },
  })

  await app.listen(envConfig.SERVE_LISTENER_PORT, () => {
    console.log(
      `listen run in ${envConfig.SERVER_API_URL}${envConfig.SWAGGER_ENDPOINT_PREFIX}\nswagger run in ${envConfig.SWAGGER_SETUP_HTTP}${envConfig.SWAGGER_SETUP_PATH}`,
    )
    infoLogger.info(
      `listen run in ${envConfig.SERVER_API_URL}${envConfig.SWAGGER_ENDPOINT_PREFIX}\nswagger run in ${envConfig.SWAGGER_SETUP_HTTP}${envConfig.SWAGGER_SETUP_PATH}`,
    )
  });
  console.log(`[xl-online-editing-server] 主服务启动成功，端口：${envConfig.SERVE_LISTENER_PORT}`);
}
bootstrap();
