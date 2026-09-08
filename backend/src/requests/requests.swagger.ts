import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CreateRequestDto } from './dto/create-request.dto';

const bodyCreate = ApiBody({ type: CreateRequestDto });
const pathId = (name = 'id') => ApiParam({ name, description: 'ID заявки' });

export const ApiCreateRequest = () =>
  applyDecorators(
    bodyCreate,
    ApiCreatedResponse(),
    ApiBadRequestResponse(),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
  );

export const ApiGetIncomingRequests = () =>
  applyDecorators(
    ApiOkResponse(),
    ApiUnauthorizedResponse(),
    ApiNotFoundResponse(),
  );

export const ApiGetOutgoingRequests = () =>
  applyDecorators(
    ApiOkResponse(),
    ApiUnauthorizedResponse(),
    ApiNotFoundResponse(),
  );

export const ApiUpdateRequest = () =>
  applyDecorators(
    pathId(),
    ApiOkResponse(),
    ApiForbiddenResponse(),
    ApiNotFoundResponse(),
    ApiUnauthorizedResponse(),
  );

export const ApiDeleteRequest = () =>
  applyDecorators(
    pathId(),
    ApiOkResponse(),
    ApiForbiddenResponse(),
    ApiNotFoundResponse(),
    ApiUnauthorizedResponse(),
  );
