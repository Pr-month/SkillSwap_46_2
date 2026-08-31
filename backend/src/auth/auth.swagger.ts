import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export function ApiAuthLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Вход пользователя в систему' }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description:
        'Успешный вход. Access и refresh токены устанавливаются в httpOnly cookies. Возвращается user',
    }),
    ApiResponse({ status: 401, description: 'Неверный email или пароль' }),
  );
}

export function ApiAuthRefresh() {
  return applyDecorators(
    ApiCookieAuth('refreshToken'),
    ApiOperation({ summary: 'Обновление пары токенов' }),
    ApiResponse({
      status: 200,
      description: 'Токены обновлены и установлены в httpOnly cookies',
    }),
    ApiResponse({
      status: 401,
      description:
        'Refresh token отсутствует, невалиден или пользователь не авторизован',
    }),
  );
}

export function ApiAuthLogout() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Выход пользователя из системы' }),
    ApiResponse({
      status: 200,
      description:
        'Пользователь вышел из системы, токены удалены, cookies очищены',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiAuthRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Регистрация нового пользователя' }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description:
        'Пользователь создан. Access и refresh токены устанавливаются в httpOnly cookies. Возвращается user',
    }),
    ApiResponse({
      status: 400,
      description: 'Ошибка валидации или город с таким ID не найден',
    }),
    ApiResponse({
      status: 409,
      description: 'Пользователь с таким email уже существует',
    }),
  );
}
