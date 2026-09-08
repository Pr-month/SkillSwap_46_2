import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import cookieParser from 'cookie-parser';
import { appConfig } from './config/app.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api');
  const applicationConfiguration = app.get<ConfigType<typeof appConfig>>(
    appConfig.KEY,
  );
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public',
  });

  app.enableCors({ origin: 'http://localhost:5173', credentials: true });
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidUnknownValues: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SkillSwap API')
    .setDescription('Документация API сервиса SkillSwap')
    .setVersion('1.0')
    .addCookieAuth(
      'accessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
      },
      'accessToken',
    )
    .addCookieAuth(
      'refreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
      },
      'refreshToken',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(applicationConfiguration.port);
}

void bootstrap();
