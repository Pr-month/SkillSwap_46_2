import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { AllExceptionFilter } from './all-exception.filter';

const TEST_URL = '/test';
const TEST_ORIGINAL_URL = '/api/test';
const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';
const POSTGRES_UNDEFINED_TABLE_CODE = '42P01';

interface TestResponseBody {
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}

describe('AllExceptionFilter', () => {
  let filter: AllExceptionFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let getRequestMock: jest.Mock;
  let responseBody: TestResponseBody | undefined;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionFilter();
    responseBody = undefined;

    jsonMock = jest.fn((body: TestResponseBody) => {
      responseBody = body;
    });

    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    getRequestMock = jest.fn().mockReturnValue({
      originalUrl: TEST_ORIGINAL_URL,
      url: TEST_URL,
    });

    host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          status: statusMock,
        }),
        getRequest: getRequestMock,
      }),
    } as unknown as ArgumentsHost;
  });

  it('returns 404 for EntityNotFoundError', () => {
    const exception = new EntityNotFoundError('User', { id: 1 });

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(responseBody).toBeDefined();

    if (!responseBody) {
      throw new Error('Response body was not captured');
    }

    expect(responseBody.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(responseBody.message).toBe('Сущность не найдена');
    expect(responseBody.path).toBe(TEST_ORIGINAL_URL);
    expect(Number.isNaN(Date.parse(responseBody.timestamp))).toBe(false);
  });

  it('returns 409 for PostgreSQL unique constraint violation', () => {
    const exception = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate key'), {
        code: POSTGRES_UNIQUE_VIOLATION_CODE,
      }),
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Запись с такими данными уже существует',
      }),
    );
  });

  it('preserves status and message of HttpException', () => {
    const message = 'Некорректные данные';
    const exception = new BadRequestException(message);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
      }),
    );
  });

  it('returns 413 for PayloadTooLargeException', () => {
    const message = 'Файл слишком большой';
    const exception = new PayloadTooLargeException(message);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message,
      }),
    );
  });

  it('uses request url when originalUrl is empty', () => {
    getRequestMock.mockReturnValue({
      originalUrl: '',
      url: TEST_URL,
    });

    filter.catch(new BadRequestException(), host);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: TEST_URL,
      }),
    );
  });

  it('returns safe 500 for a database error with another code', () => {
    const privateDatabaseMessage = 'relation users does not exist';
    const exception = new QueryFailedError(
      'SELECT',
      [],
      Object.assign(new Error(privateDatabaseMessage), {
        code: POSTGRES_UNDEFINED_TABLE_CODE,
      }),
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Внутренняя ошибка сервера',
      }),
    );
  });

  it('preserves a string response from HttpException', () => {
    const message = 'Доступ запрещён';
    const exception = new HttpException(message, HttpStatus.FORBIDDEN);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message,
      }),
    );
  });

  it('preserves validation message array from HttpException', () => {
    const messages = ['email must be an email', 'name should not be empty'];
    const exception = new BadRequestException({ message: messages });

    filter.catch(exception, host);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: messages,
      }),
    );
  });

  it('returns safe 500 response for an unknown error', () => {
    const privateErrorMessage = 'database password leaked';

    filter.catch(new Error(privateErrorMessage), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Внутренняя ошибка сервера',
      }),
    );
  });
});
