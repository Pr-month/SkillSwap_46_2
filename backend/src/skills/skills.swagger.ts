import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

export function ApiSkillsCreate() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({
      summary: 'Создание навыка',
      description:
        'Авторизованный пользователь автоматически становится владельцем навыка',
    }),
    ApiBody({ type: CreateSkillDto }),
    ApiResponse({ status: 201, description: 'Навык создан' }),
    ApiResponse({ status: 400, description: 'Ошибка валидации' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 404,
      description: 'Категория с указанным id не найдена',
    }),
  );
}

export function ApiSkillsFindAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'Список навыков с поиском и пагинацией (публичный)',
      description:
        'Поиск по названию без учёта регистра, сортировка по дате создания (новые сверху)',
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

export function ApiSkillsFindOne() {
  return applyDecorators(
    ApiOperation({
      summary: 'Навык по id (заглушка, не реализовано)',
      deprecated: true,
    }),
    ApiResponse({ status: 200, description: 'Заглушка от генератора' }),
  );
}

export function ApiSkillsUpdate() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Обновление собственного навыка' }),
    ApiParam({ name: 'id', description: 'UUID навыка', format: 'uuid' }),
    ApiBody({ type: UpdateSkillDto }),
    ApiResponse({ status: 200, description: 'Навык обновлён' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Нельзя редактировать чужой навык',
    }),
    ApiResponse({
      status: 404,
      description: 'Навык не найден или категория для переноса не найдена',
    }),
  );
}

export function ApiSkillsRemove() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Удаление собственного навыка' }),
    ApiParam({ name: 'id', description: 'UUID навыка', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: '{ message: "Навык успешно удален" }',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Нельзя удалить чужой навык' }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
  );
}

export function ApiSkillsAddFavorite() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Добавить навык в избранное' }),
    ApiParam({ name: 'id', description: 'UUID навыка', format: 'uuid' }),
    ApiResponse({
      status: 201,
      description: '{ message: "Навык добавлен в избранное" }',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Навык не найден' }),
    ApiResponse({ status: 409, description: 'Навык уже добавлен в избранное' }),
  );
}

export function ApiSkillsRemoveFavorite() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Убрать навык из избранного' }),
    ApiParam({ name: 'id', description: 'UUID навыка', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: '{ message: "Навык удалён из избранного" }',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Навык не найден в избранном' }),
  );
}
