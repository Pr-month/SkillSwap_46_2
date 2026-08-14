import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { UpdateRequestDto } from './dto/update-request.dto';
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
@Roles([Role.USER, Role.ADMIN])
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);

  constructor(private readonly requestsService: RequestsService) {}

  @Post()
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
  @ApiGetIncomingRequests()
  async findIncoming(@Req() req: AuthResponse) {
    const userId = req.user.sub;
    this.logger.debug(`Fetching incoming requests for ${userId}`);
    return this.requestsService.findIncoming(userId);
  }

  @Get('outgoing')
  @ApiGetOutgoingRequests()
  async findOutgoing(@Req() req: AuthResponse) {
    const userId = req.user.sub;
    this.logger.debug(`Fetching outgoing requests for ${userId}`);
    return this.requestsService.findOutgoing(userId);
  }

  @Patch(':id')
  @ApiUpdateRequest()
  async update(
    @Req() req: AuthResponse,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRequestDto: UpdateRequestDto,
  ) {
    const userId = req.user.sub;
    this.logger.debug(`User ${userId} updating request ${id}`);
    return this.requestsService.update(id, updateRequestDto, userId);
  }

  @Delete(':id')
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
