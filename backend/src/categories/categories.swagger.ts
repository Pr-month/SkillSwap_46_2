import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export function ApiCategoriesFindAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'Список корневых категорий с подкатегориями (публичный)',
      description:
        'Возвращает только корневые категории (без родителя), каждая с массивом children, отсортированы по названию',
    }),
    ApiResponse({
      status: 200,
      description:
        'Массив корневых категорий: { id, name, children: [{ id, name }] }',
    }),
  );
}

export function ApiCategoriesFindOne() {
  return applyDecorators(
    ApiOperation({ summary: 'Категория по id (публичный)' }),
    ApiParam({ name: 'id', description: 'UUID категории', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Категория с родителем (parent) и подкатегориями (children)',
    }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiCategoriesCreate() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Создание категории (только админ)' }),
    ApiBody({ type: CreateCategoryDto }),
    ApiResponse({ status: 201, description: 'Категория создана' }),
    ApiResponse({
      status: 400,
      description: 'Родительская категория с таким id не найдена',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав: требуется роль ADMIN',
    }),
  );
}

export function ApiCategoriesUpdate() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({
      summary: 'Обновление названия или родителя категории (только админ)',
    }),
    ApiParam({ name: 'id', description: 'UUID категории', format: 'uuid' }),
    ApiBody({ type: UpdateCategoryDto }),
    ApiResponse({ status: 200, description: 'Категория обновлена' }),
    ApiResponse({
      status: 400,
      description:
        'Категория не может быть родителем самой себя или перенесена в собственную подкатегорию; родитель не найден',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав: требуется роль ADMIN',
    }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiCategoriesRemove() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Удаление категории (только админ)' }),
    ApiParam({ name: 'id', description: 'UUID категории', format: 'uuid' }),
    ApiResponse({
      status: 204,
      description: 'Категория удалена вместе со всеми подкатегориями (CASCADE)',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав: требуется роль ADMIN',
    }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}
