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
import { Request, Response } from 'express';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { JwtPayload } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const user = req.user as JwtPayload | undefined;

    if (!user?.sub) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    await this.authService.deleteRefreshToken(user.sub);
    res.clearCookie('refreshToken');
    return res.status(HttpStatus.OK).json({ message: 'Выход выполнен успешно' });
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
