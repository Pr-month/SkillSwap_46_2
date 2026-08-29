import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatus } from './request-status.enums';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';
import { AuthResponse } from '../auth/auth.types';
import {
  ApiCreateRequest,
  ApiGetIncomingRequests,
  ApiGetOutgoingRequests,
  ApiUpdateRequest,
  ApiDeleteRequest,
} from './requests.swagger';

@ApiTags('requests')
@Controller('requests')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);

  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles([Role.USER, Role.ADMIN])
  @ApiCreateRequest()
  async create(
    @Req() req: AuthResponse,
    @Body() createRequestDto: CreateRequestDto,
  ) {
    const senderId = req.user.sub;
    this.logger.log(`Creating request by ${senderId}`);
    return this.requestsService.create(createRequestDto, senderId);
  }

  @Get('incoming')
  @Roles([Role.USER, Role.ADMIN])
  @ApiGetIncomingRequests()
  async findIncoming(@Req() req: AuthResponse) {
    const userId = req.user.sub;
    this.logger.debug(`Fetching incoming requests for ${userId}`);
    return this.requestsService.findIncoming(userId);
  }

  @Get('outgoing')
  @Roles([Role.USER, Role.ADMIN])
  @ApiGetOutgoingRequests()
  async findOutgoing(@Req() req: AuthResponse) {
    const userId = req.user.sub;
    this.logger.debug(`Fetching outgoing requests for ${userId}`);
    return this.requestsService.findOutgoing(userId);
  }

  @Patch(':id/read')
  @Roles([Role.USER, Role.ADMIN])
  @ApiUpdateRequest()
  async markRead(
    @Req() req: AuthResponse,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = req.user.sub;
    this.logger.debug(`User ${userId} marking request ${id} as READ`);
    return this.requestsService.markRead(id, userId);
  }

  @Patch(':id/accept')
  @Roles([Role.USER, Role.ADMIN])
  @ApiUpdateRequest()
  async accept(
    @Req() req: AuthResponse,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = req.user.sub;
    this.logger.debug(`User ${userId} accepting request ${id}`);
    return this.requestsService.updateStatus(
      id,
      userId,
      RequestStatus.ACCEPTED,
    );
  }

  @Patch(':id/reject')
  @Roles([Role.USER, Role.ADMIN])
  @ApiUpdateRequest()
  async reject(
    @Req() req: AuthResponse,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = req.user.sub;
    this.logger.debug(`User ${userId} rejecting request ${id}`);
    return this.requestsService.updateStatus(
      id,
      userId,
      RequestStatus.REJECTED,
    );
  }

  @Delete(':id')
  @Roles([Role.USER, Role.ADMIN])
  @ApiDeleteRequest()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthResponse,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = req.user.sub;
    const isAdmin = req.user.role === Role.ADMIN;
    this.logger.debug(
      `User ${userId} removing request ${id} (admin=${isAdmin})`,
    );
    await this.requestsService.remove(id, userId, isAdmin);
  }
}
