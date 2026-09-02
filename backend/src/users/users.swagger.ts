import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export function ApiUsersFindAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'Список пользователей с пагинацией (публичный)',
    }),
    ApiResponse({
      status: 200,
      description: 'Страница списка: { data, page, totalPages }',
    }),
    ApiResponse({
      status: 404,
      description: 'Запрашиваемая страница не найдена',
    }),
  );
}

export function ApiUsersGetMe() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Профиль текущего пользователя' }),
    ApiResponse({
      status: 200,
      description:
        'Полный профиль, город возвращается объектом { id, name, region } или null',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiUsersUpdateMe() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Обновление профиля текущего пользователя' }),
    ApiBody({ type: UpdateUserDto }),
    ApiResponse({
      status: 200,
      description:
        'Профиль обновлён. cityId: существующий uuid — установить город, null — сбросить, поле не передано — не менять',
    }),
    ApiResponse({
      status: 400,
      description: 'Ошибка валидации или город с таким id не найден',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Пользователь не найден' }),
  );
}

export function ApiUsersChangePassword() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Смена пароля текущего пользователя' }),
    ApiBody({ type: ChangePasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Пароль успешно изменён: { message }',
    }),
    ApiResponse({
      status: 400,
      description:
        'Неверный текущий пароль или новый пароль совпадает со старым',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Пользователь не найден' }),
  );
}

export function ApiUsersFindOne() {
  return applyDecorators(
    ApiOperation({
      summary: 'Пользователь по id (заглушка, не реализовано)',
      deprecated: true,
    }),
    ApiResponse({ status: 200, description: 'Заглушка от генератора' }),
  );
}

export function ApiUsersRemove() {
  return applyDecorators(
    ApiOperation({
      summary: 'Удаление пользователя по id (заглушка, не реализовано)',
      deprecated: true,
    }),
    ApiResponse({ status: 200, description: 'Заглушка от генератора' }),
  );
}
