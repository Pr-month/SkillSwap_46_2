import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { JwtPayload } from '../auth/auth.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  getMe(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @UseGuards(AccessTokenGuard)
  updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const user = req.user as JwtPayload;
    return this.usersService.update(user.sub, dto);
  }

  @Patch('me/password')
  @UseGuards(AccessTokenGuard)
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const user = req.user as JwtPayload;
    return this.usersService.changePassword(user.sub, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
