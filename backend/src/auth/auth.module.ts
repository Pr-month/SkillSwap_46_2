import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { jwtConfig } from '../config/jwt.config';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    TypeOrmModule.forFeature([User, City]),
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.accessSecret,
        signOptions: {
          expiresIn: config.accessExpiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    AccessTokenStrategy,
    RefreshTokenGuard,
    RefreshTokenStrategy,
    WsJwtGuard,
  ],
  exports: [JwtModule, AccessTokenGuard, RefreshTokenGuard, WsJwtGuard],
})
export class AuthModule {}
