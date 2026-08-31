import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { JwtPayload } from '../auth/auth.types';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiUsersChangePassword,
  ApiUsersFindAll,
  ApiUsersFindOne,
  ApiUsersGetMe,
  ApiUsersRemove,
  ApiUsersUpdateMe,
} from './users.swagger';
import { UpdateWantToLearnDto } from './dto/update-want-to-learn.dto';
import { retry } from 'rxjs';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiUsersFindAll()
  findAll(@Query() dto: FindUsersDto) {
    return this.usersService.findAll(dto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiUsersGetMe()
  getMe(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @UseGuards(AccessTokenGuard)
  @ApiUsersUpdateMe()
  updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const user = req.user as JwtPayload;
    return this.usersService.update(user.sub, dto);
  }

  @Patch('me/password')
  @UseGuards(AccessTokenGuard)
  @ApiUsersChangePassword()
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const user = req.user as JwtPayload;
    return this.usersService.changePassword(user.sub, dto);
  }

  @Get(':id')
  @ApiUsersFindOne()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Delete(':id')
  @ApiUsersRemove()
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Patch('me/want-to-learn')
  @UseGuards(AccessTokenGuard)
  updateWantToLearn(@Req() req: Request, @Body() dto: UpdateWantToLearnDto) {
    const user = req.user as JwtPayload;
    return this.usersService.updateWantToLearn(user.sub, dto.categoryIds);
  }
}
