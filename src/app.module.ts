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
import { User } from './users/entities/user.entity';
import { CitiesModule } from './cities/cities.module';
import { RequestsModule } from './requests/requests.module';

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
    UsersModule,
    AuthModule,
    SkillsModule,
    CategoriesModule,
    FilesModule,
    CitiesModule,
    RequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
