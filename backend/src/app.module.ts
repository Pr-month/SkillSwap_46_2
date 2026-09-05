import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { dbConfig, TDbConfig, getEnvFilePath } from './config/db.config';
import { UsersModule } from './users/users.module';
import { SkillsModule } from './skills/skills.module';
import { CategoriesModule } from './categories/categories.module';
import { FilesModule } from './files/files.module';
import { CitiesModule } from './cities/cities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RequestsModule } from './requests/requests.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig],
      envFilePath: getEnvFilePath(),
    }),
    TypeOrmModule.forRootAsync({
      inject: [dbConfig.KEY],
      useFactory: (config: TDbConfig) => ({
        ...config,
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    UsersModule,
    AuthModule,
    SkillsModule,
    CategoriesModule,
    FilesModule,
    CitiesModule,
    NotificationsModule,
    RequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService,
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}

  ],
})
export class AppModule {}
