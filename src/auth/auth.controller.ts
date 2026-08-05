import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Response } from 'express';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtPayload, RequestWithUser } from './auth.types';
import { Roles } from './decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return res.status(HttpStatus.OK).json({ message: 'Выход выполнен успешно' });
  }

  @Get()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
