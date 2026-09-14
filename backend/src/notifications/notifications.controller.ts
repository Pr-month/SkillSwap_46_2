import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthResponse } from '../auth/auth.types';
import { Role } from '../shared/enums/role.enum';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AccessTokenGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles([Role.USER, Role.ADMIN])
  @ApiOperation({ summary: 'Получить уведомления текущего пользователя' })
  @ApiOkResponse({ description: 'Список уведомлений пользователя' })
  findAll(@Req() req: AuthResponse) {
    return this.notificationsService.findAllForUser(req.user.sub);
  }

  @Patch('read-all')
  @Roles([Role.USER, Role.ADMIN])
  @ApiOperation({ summary: 'Отметить все уведомления прочитанными' })
  @ApiOkResponse({ description: 'Количество обновлённых уведомлений' })
  markAllAsRead(@Req() req: AuthResponse) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Patch(':id/read')
  @Roles([Role.USER, Role.ADMIN])
  @ApiOperation({ summary: 'Отметить уведомление прочитанным' })
  @ApiOkResponse({ description: 'Обновлённое уведомление' })
  markAsRead(@Req() req: AuthResponse, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }
}
