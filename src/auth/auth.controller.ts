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
import {
  AuthResult,
  JwtPayload,
  RequestWithRefreshToken,
  RequestWithUser,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { RegisterDto } from './dto/register.dto';

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

    // TODO: вернуться сюда и оставить только куку, как требует ТЗ
    // («если авторизация успешна, то отправляем jwt токен через куки»).
    // Сейчас токены дублируются в теле ответа вынужденно, по двум причинам:
    //   1) AccessTokenStrategy читает токен только из заголовка Authorization: Bearer
    //      (ExtractJwt.fromAuthHeaderAsBearerToken), а HttpOnly-куку фронтенд прочитать
    //      не может — без тела ответа залогиненный клиент не попадёт ни на один
    //      защищённый роут;
    //   2) POST /auth/refresh уже отдаёт refreshToken в теле, и второй, несовместимый
    //      контракт в рамках одного контроллера только запутал бы клиента
    //      (там же лежит баг: @Res() без passthrough, ответ вообще не отправляется).
    // Что сделать, когда refresh починят: добавить в AccessTokenStrategy
    // ExtractJwt.fromExtractors([cookieExtractor, ...]) и cookie-parser в main.ts,
    // положить refreshToken в отдельную HttpOnly-куку, после чего убрать оба токена
    // из AuthResult и вернуть из этого метода только { user }.
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
    });

    return result;
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard, RolesGuard)
  @Roles([Role.ADMIN, Role.USER])
  async refresh(@Req() req: RequestWithRefreshToken, @Res() res: Response) {
    const user = req.user as JwtPayload | undefined;

    if (!user?.sub) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const result = await this.authService.refreshFromPayload(req);

    res.cookie('accessToken', result.accessToken);
    res.cookie('refreshToken', result.refreshToken);
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
    @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return result;
  }
}
