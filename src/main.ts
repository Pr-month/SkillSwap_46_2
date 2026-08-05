import { ClassSerializerInterceptor } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const application = await NestFactory.create(AppModule);
  const applicationConfiguration = application.get<
    ConfigType<typeof appConfig>
  >(appConfig.KEY);

  application.useGlobalFilters(new AllExceptionFilter());
  application.useGlobalInterceptors(
    new ClassSerializerInterceptor(application.get(Reflector)),
  );

  await application.listen(applicationConfiguration.port);
}

void bootstrap();
