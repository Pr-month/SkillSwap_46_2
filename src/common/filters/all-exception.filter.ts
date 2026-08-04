import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}

interface ResolvedException {
  statusCode: number;
  message: string | string[];
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();

    const resolvedException = this.resolveException(exception);

    const responseBody: ErrorResponse = {
      statusCode: resolvedException.statusCode,
      message: resolvedException.message,
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(resolvedException.statusCode).json(responseBody);
  }

  private resolveException(exception: unknown): ResolvedException {
    if (exception instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Сущность не найдена',
      };
    }

    if (
      exception instanceof QueryFailedError &&
      this.isUniqueViolation(exception.driverError as unknown)
    ) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Запись с такими данными уже существует',
      };
    }

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: this.getHttpExceptionMessage(exception),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
    };
  }

  private isUniqueViolation(driverError: unknown): boolean {
    if (
      typeof driverError !== 'object' ||
      driverError === null ||
      !('code' in driverError)
    ) {
      return false;
    }

    return driverError.code === POSTGRES_UNIQUE_VIOLATION_CODE;
  }

  private getHttpExceptionMessage(exception: HttpException): string | string[] {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = exceptionResponse.message;

      if (typeof message === 'string' || Array.isArray(message)) {
        return message;
      }
    }

    return exception.message;
  }
}
