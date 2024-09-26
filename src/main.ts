import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { HttpResponseExceptionFilter } from '~/exceptions/http-response.exception';
import { ValidationPipe } from '~/pipes/validation.pipe';
import { HttpResponseTransformInterceptor } from '~/transforms/http-response.transform';
import { FILE_DEST, FILE_ROOT_PATH } from '~/helpers/file.helper/local.client';
import { infoLogger } from '~/logger/index'

import { AppModule } from '~/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['warn', 'error'],
  });

  const config = app.get(ConfigService);
  const port = config.get('server.port') || 5002;
  const swaggerConfig = config.get('swagger')

  app.enableCors({
    origin: config.get('client.siteUrl'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  config.get('server.enableRateLimit') &&
  app.use(
    rateLimit({
      windowMs: config.get('server.rateLimitWindowMs'),
      max: config.get('server.rateLimitMax'),
    })
  );

  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  app.use(cookieParser());
  app.use(compression());
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.useGlobalFilters(new HttpResponseExceptionFilter());
  app.useGlobalInterceptors(new HttpResponseTransformInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix(config.get('server.prefix') || '/');

  // DocumentBuilder是一个辅助类，有助于结构的基本文件SwaggerModule。它包含几种方法，可用于设置诸如标题，描述，版本等属性。
  const options = new DocumentBuilder()
  .setTitle(swaggerConfig.title)
  .setDescription(swaggerConfig.titleDesc) // 文档介绍
  .setVersion(swaggerConfig.apiVersion) // 文档版本
  .addBearerAuth()
  .addTag('') // 每个tag标签都可以对应着几个@ApiUseTags('用户,安全') 然后被ApiUseTags注释，字符串一致的都会变成同一个标签下的
  // .setBasePath(envConfig.SWAGGER_SETUP_HTTP)
  .build()
  // 为了创建完整的文档（具有定义的HTTP路由），我们使用类的createDocument()方法SwaggerModule。此方法带有两个参数，分别是应用程序实例和基本Swagger选项。
  const document = SwaggerModule.createDocument(app, options)
  // 最后一步是setup()。它依次接受（1）装入Swagger的路径，（2）应用程序实例, （3）描述Nest应用程序的文档。
  SwaggerModule.setup(`${swaggerConfig.setupPath}`, app, document, {
    // customCssUrl: `${envConfig.SWAGGER_CND_URL}/swagger-ui.css`,
    // customJs: `${envConfig.SWAGGER_CND_URL}/swagger-ui-bundle.js,
    // ${envConfig.SWAGGER_CND_URL}/swagger-ui-standalone-preset.js`,
    // customCssUrl: ['https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.6.2/swagger-ui.css'],
    // customJs: [
    //   'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.0/swagger-ui-bundle.js',
    //   'https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.6.2/swagger-ui-standalone-preset.js',
    // ],
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

  if (config.get('oss.local.enable')) {
    const serverStatic = express.static(FILE_ROOT_PATH);
    app.use(FILE_DEST, (req, res, next) => {
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      return serverStatic(req, res, next);
    });
  }

  await app.listen(port, () => {
    console.log(
      `listen run in ${swaggerConfig.setupHttp}:${port}\nswagger run in ${swaggerConfig.setupHttp}:${port}/${swaggerConfig.setupPath}`,
    )
    infoLogger.info(
      `listen run in ${swaggerConfig.setupHttp}:${port}\nswagger run in ${swaggerConfig.setupHttp}:${port}/${swaggerConfig.setupPath}`,
    )
  });
  console.log(`[slayKit-server] 主服务启动成功，端口：${port}`);
}
bootstrap();
