# SkillSwap

SkillSwap — веб-приложение для обмена навыками между пользователями. Участники могут рассказывать о своих навыках, находить людей с нужными знаниями и договариваться о взаимном обучении.

## Возможности

- регистрация и авторизация пользователей;
- просмотр и редактирование профиля;
- создание и редактирование предложений о навыках;
- поиск навыков по категориям и городам;
- отправка заявок на обмен;
- принятие и отклонение заявок;
- добавление навыков в избранное;
- уведомления о событиях, связанных с заявками;
- загрузка пользовательских файлов;
- разграничение публичных и защищённых маршрутов.

## Технологии

### Frontend

- React 19;
- TypeScript;
- Vite;
- React Router;
- Redux Toolkit;
- CSS Modules;
- Jest и Testing Library;
- Storybook;
- Socket.IO Client.

### Backend

- Node.js 20;
- NestJS;
- TypeScript;
- TypeORM;
- PostgreSQL;
- JWT;
- Passport;
- Socket.IO;
- Jest.

### Инфраструктура

- Docker;
- Docker Compose;
- GitHub Actions.

## Структура проекта

~~~text
SkillSwap_46_2/
├── backend/               # REST API, бизнес-логика и база данных
│   └── src/
│       ├── auth/          # Авторизация и JWT
│       ├── categories/    # Категории навыков
│       ├── cities/        # Города
│       ├── files/         # Работа с файлами
│       ├── mail/          # Отправка писем
│       ├── notifications/ # Уведомления
│       ├── requests/      # Заявки на обмен
│       ├── skills/        # Навыки
│       └── users/         # Пользователи
├── frontend/              # Клиентское React-приложение
├── docker-compose.yml     # Запуск сервисов через Docker Compose
└── .env.example           # Пример переменных окружения
~~~

## Запуск через Docker Compose

### Требования

Перед запуском установите:

- [Git](https://git-scm.com/);
- [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Установка

Клонируйте репозиторий:

~~~bash
git clone https://github.com/Pr-month/SkillSwap_46_2.git
cd SkillSwap_46_2
~~~

Создайте файл `.env` из примера.

Для Linux и macOS:

~~~bash
cp .env.example .env
~~~

Для Windows PowerShell:

~~~powershell
Copy-Item .env.example .env
~~~

Замените тестовые значения секретов в `.env`:

~~~env
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
~~~

Запустите приложение:

~~~bash
docker compose up --build
~~~

После запуска доступны:

- frontend: [http://localhost:5173](http://localhost:5173);
- backend: [http://localhost:3000](http://localhost:3000);
- PostgreSQL: `localhost:5432`.

Для остановки контейнеров:

~~~bash
docker compose down
~~~

Чтобы также удалить локальный том базы данных:

~~~bash
docker compose down --volumes
~~~

> Команда с `--volumes` удаляет данные локальной базы без возможности восстановления.

## Локальный запуск без Docker

### Требования

- Node.js 20 или новее;
- npm;
- PostgreSQL 15 или новее.

### Backend

Перейдите в папку backend и установите зависимости:

~~~bash
cd backend
npm install
~~~

Создайте локальный файл окружения.

Для Linux и macOS:

~~~bash
cp .env.example .env
~~~

Для Windows PowerShell:

~~~powershell
Copy-Item .env.example .env
~~~

Укажите параметры подключения к PostgreSQL и запустите сервер:

~~~bash
npm run start:dev
~~~

По умолчанию backend работает на [http://localhost:3000](http://localhost:3000).

### Frontend

Откройте второй терминал:

~~~bash
cd frontend
npm install
~~~

Создайте файл окружения.

Для Linux и macOS:

~~~bash
cp .env.example .env
~~~

Для Windows PowerShell:

~~~powershell
Copy-Item .env.example .env
~~~

Запустите frontend:

~~~bash
npm run dev
~~~

По умолчанию приложение доступно на [http://localhost:5173](http://localhost:5173).

## Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `VITE_API_URL` | Адрес backend для frontend |
| `PORT` | Порт backend |
| `DB_DRIVER` | Драйвер базы данных |
| `DB_HOST` | Адрес сервера PostgreSQL |
| `DB_PORT` | Порт PostgreSQL |
| `DB_USERNAME` | Имя пользователя базы данных |
| `DB_PASSWORD` | Пароль пользователя базы данных |
| `DB_NAME` | Название базы данных |
| `DB_SSL` | Использование SSL при подключении к БД |
| `DB_SYNC` | Автоматическая синхронизация схемы TypeORM |
| `JWT_ACCESS_SECRET` | Секрет access-токена |
| `JWT_ACCESS_EXPIRES_IN` | Срок действия access-токена |
| `JWT_REFRESH_SECRET` | Секрет refresh-токена |
| `JWT_REFRESH_EXPIRES_IN` | Срок действия refresh-токена |
| `ADMIN_EMAIL` | Email администратора |
| `ADMIN_PASSWORD` | Пароль администратора |

Настройки почтового сервиса перечислены в `backend/.env.example`.

> `DB_SYNC=true` следует использовать только с локальной базой данных. Для общей или production-базы необходимо установить `DB_SYNC=false` и применять миграции.

## Миграции

Команды выполняются из папки `backend`.

Применить миграции:

~~~bash
npm run migration:run
~~~

Отменить последнюю миграцию:

~~~bash
npm run migration:revert
~~~

Создать новую миграцию:

~~~bash
npm run migration:create -- src/migrations/MigrationName
~~~

## Проверка проекта

### Frontend

Команды выполняются из папки `frontend`:

~~~bash
npm run build
npm run lint
npm run stylelint
npm test
~~~

Запуск Storybook:

~~~bash
npm run storybook
~~~

### Backend

Команды выполняются из папки `backend`:

~~~bash
npm run build
npm run lint
npm test
npm run test:e2e
~~~

## Основные маршруты frontend

| Маршрут | Назначение |
| --- | --- |
| `/` | Главная страница и каталог навыков |
| `/registration` | Регистрация |
| `/login` | Авторизация |
| `/skill/:id` | Просмотр навыка |
| `/skill/create` | Создание навыка |
| `/skill/edit/:id` | Редактирование навыка |
| `/profile` | Профиль пользователя |
| `/profile/favorites` | Избранные навыки |

Маршруты создания и редактирования навыков, профиля и избранного доступны только авторизованным пользователям.

## Работа с ветками

Основная ветка разработки — `dev`. Для каждой задачи создаётся отдельная feature-ветка от актуальной версии `origin/dev`. Изменения отправляются в `dev` через Pull Request.