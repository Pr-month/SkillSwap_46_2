# SkillSwap API

Backend-приложение сервиса SkillSwap — платформы для обмена навыками между пользователями.

Проект реализован на NestJS и предоставляет REST API для авторизации, работы с пользователями, навыками, категориями, городами, файлами, заявками и уведомлениями.

## Документация

- [Техническое задание](https://docs.google.com/document/d/1d4o9Sb9o6lxXuqdEgKe4eRlH2s7gKrh0icJ3gyv2FD4/edit?tab=t.0#heading=h.ynonjn54b672)
- [Макет](https://www.figma.com/design/bKwOakHJI7Z2mh2zVCBphP/SkillSwap---Для-разработчиков?node-id=0-1&p=f&t=HH7S4bYwVVtxLM6z-0)

## Стек

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- TypeORM
- JWT
- Passport
- bcrypt
- class-validator
- Swagger / OpenAPI
- Jest
- Supertest
- Socket.IO

## Основные модули

В приложении реализованы модули:

- `auth` — регистрация, вход и авторизация;
- `users` — работа с пользователями;
- `skills` — навыки;
- `categories` — категории навыков;
- `cities` — города;
- `files` — загрузка файлов;
- `requests` — заявки между пользователями;
- `notifications` — уведомления.

## API

Для всех API-эндпоинтов используется глобальный префикс:

```text
/api
```

После локального запуска Swagger-документация доступна по адресу:

```text
http://localhost:3000/api/docs
```

Swagger настроен с поддержкой cookie-аутентификации через:

- `accessToken`;
- `refreshToken`.

## Установка

Клонируйте репозиторий:

```bash
git clone https://github.com/Pr-month/SkillSwap_46_2.git
cd SkillSwap_46_2
```

Установите зависимости:

```bash
npm ci
```

## Переменные окружения

Создайте локальный файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Все необходимые переменные окружения и их примерные значения находятся в `.env.example`.

Перед запуском приложения должна быть доступна PostgreSQL с параметрами, указанными в `.env`.

## Запуск

Режим разработки:

```bash
npm run start:dev
```

Обычный запуск:

```bash
npm start
```

Сборка:

```bash
npm run build
```

Запуск собранного приложения:

```bash
npm run start:prod
```

По умолчанию приложение запускается на порту `3000`.

## Тесты

Unit-тесты:

```bash
npm test
```

Unit-тесты с отчётом о покрытии:

```bash
npm run test:cov
```

E2E-тесты:

```bash
npm run test:e2e
```

Запуск тестов в режиме наблюдения:

```bash
npm run test:watch
```

## Проверка кода

Линтер:

```bash
npm run lint
```

Форматирование:

```bash
npm run format
```

> `npm run lint` настроен с флагом `--fix`, поэтому команда может автоматически изменять файлы.

## Начальные данные

Для заполнения базы предусмотрены команды:

```bash
npm run seed:user
npm run seed:admin
npm run seed:categories
npm run seed:skills
npm run seed:cities
```

## Работа с Git

Основные ветки проекта:

- `main` — стабильная версия приложения;
- `dev` — актуальная общая ветка разработки.

Прямой push в `main` и `dev` не используется.

Все новые изменения выполняются в отдельных рабочих ветках, созданных от актуальной `dev`.

### Начало задачи

Перед началом работы:

```bash
git fetch origin --prune
git switch dev
git pull --ff-only origin dev
```

После обновления `dev` создаётся отдельная ветка задачи:

```bash
git switch -c dev-username-task-name
```

Например:

```bash
git switch -c dev-reshetnikovav89-readme-update
```

### Завершение задачи

После выполнения и проверки изменений рабочая ветка отправляется в удалённый репозиторий:

```bash
git push -u origin dev-username-task-name
```

Pull request создаётся по схеме:

```text
рабочая ветка → dev
```

После merge следующая задача снова начинается от обновлённой `dev`.

Текущий рабочий процесс:

```text
dev
 └── dev-username-task-name
      └── Pull Request → dev
```

После завершения разработки и необходимых проверок стабильные изменения могут быть перенесены из `dev` в `main`.

## Текущее состояние проекта

MVP backend-приложения сформирован.

Дальнейшая разработка ведётся через `dev`. Новые задачи могут включать расширение API, E2E-тесты, инфраструктурные изменения, подключение frontend и дополнительный функционал.
