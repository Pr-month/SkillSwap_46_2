import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConfig } from './db.config';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [dbConfig.KEY],
      useFactory: (config: ConfigType<typeof dbConfig>) => config,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
