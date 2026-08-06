import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthResult, JwtPayload, RequestWithUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const result = await this.authService.login(loginDto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
    });

    return result;
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard, RolesGuard)
  @Roles([Role.ADMIN, Role.USER])
  async refresh(@Req() req: RequestWithUser, @Res() res: Response) {
    const user = req.user as JwtPayload | undefined;

    if (!user?.sub) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const result = await this.authService.refreshFromPayload(user);

    res.cookie('accessToken', result.accessToken);

    return {
      refreshToken: result.refreshToken,
    };
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.USER, Role.ADMIN])
  async logout(@Req() req: RequestWithUser, @Res() res: Response) {
    const user = req.user;
    await this.authService.deleteRefreshToken(user.sub);
    res.clearCookie('refreshToken');
    return res
      .status(HttpStatus.OK)
      .json({ message: 'Выход выполнен успешно' });
  }
}
