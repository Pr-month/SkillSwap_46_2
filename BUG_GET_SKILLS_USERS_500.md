# Баг: `GET /skills` и `GET /users` возвращают 500 (Internal Server Error)

## Где проявляется
- В CI (workflow `.github/workflows/ci.yml`, job **Run E2E Tests (backend)**), команда `npm run test:e2e:all`.
- Локально воспроизводится тем же прогоном при наличии тестовой БД `skillswap_test` (`.env.test.local`).

## Симптомы
- E2E-тесты `test/skills.e2e-spec.ts` (3 теста) и `test/users.e2e-spec.ts` (1 тест) падают:
  ```
  ● SkillsController (e2e) › GET /skills › возвращает структуру пагинации
    expected 200 "OK", got 500 "Internal Server Error"
  ● SkillsController (e2e) › GET /skills › фильтрует по search
    expected 200 "OK", got 500 "Internal Server Error"
  ● SkillsController (e2e) › GET /skills › возвращает 404, если страница больше totalPages
    expected 404 "Not Found", got 500 "Internal Server Error"
  ● UsersController (e2e) › GET /users (список) › возвращает список пользователей для админа
    expected 200 "OK", got 500 "Internal Server Error"
  ```
- Остальные e2e (`app`, `auth`, `cities`, `files`, `categories`) — проходят (54 из 58 тестов зелёные).
- Сидинг при этом **работает**: создаются 1134 города, категории, админ, **2 пользователя**, **4 навыка** (`Seeded 2 users`, `Seeded 4 skills`). То есть данные в БД есть, но списковые эндпоинты всё равно падают.

## Причина (найдена и устранена)
Корневая причина — **не пагинационный SQL**, а то, что e2e-приложение создаётся в тестах **без `ValidationPipe`** (`main.ts` применяет его с `transform: true`, но в `test/*.e2e-spec.ts` вызывается только `app.useGlobalFilters(new AllExceptionFilter())`).

Без pipe дефолтные значения DTO (`page = 1`, `limit = 20`, `search = ''`) **не подставляются**, поэтому при `GET /skills` и `GET /users` без query-параметров `dto` приходит пустым. В сервисах:
- `SkillsService.findAll`: `const { page, limit, search } = dto` → `undefined`;
- `UsersService.findAll`: `const { page, limit } = dto` → `undefined`;

и вычисление `(page - 1) * limit` даёт `NaN`, из-за чего TypeORM строит `OFFSET NaN` → `QueryFailedError` → **500**.

Именно поэтому падают только эндпоинты, считающие пагинацию по `(page-1)*limit` (skills, users), а `cities`, `categories`, `files`, `auth` (без пагинации) проходят.

### Исправление
В обоих сервисах добавлены дефолтные значения при деструктуризации (сервис больше не зависит от наличия `ValidationPipe`):
- `backend/src/skills/skills.service.ts` → `const { page = 1, limit = 20, search = '' } = dto;`
- `backend/src/users/users.service.ts` → `const { page = 1, limit = 20 } = dto;`

Это безопаснее, чем полагаться только на DTO: работает и в production, и в e2e, и при прямом вызове сервиса. Повторный прогон `npm run test:e2e:all` должен стать зелёным (проверяется в CI).

> Альтернатива: добавить `new ValidationPipe({ transform: true })` в каждый e2e-спецификации (зеркально `main.ts`), но это потребовало бы правок во всех e2e-файлах, тогда как дефолты в сервисах решают проблему локально и навсегда.

---

## Доп. проблемы фронтенда (найдены после merge, не исправляются здесь) — для создания отдельных задач

После слияния `dev` (09.09) во фронтенде остались **ошибки коллег**, из-за которых не проходят unit-тесты. Не исправляю их в этом PR, чтобы не задевать чужую работу. Нужны отдельные задачи:

1. **`frontend/src/api/categoryApi.ts`** — `mapCategory()` не возвращает новые обязательные поля `ISkillsCategory` (`wantToLearnUsers`, `skills`) → ошибка TS2739 (файл не компилируется).
2. **`frontend/src/services/user/selectors.ts`** — ошибки типов из-за опциональных полей `IUserProfile.userSkill`/`createdAt`:
   - строка 29: `likesCount[b.userSkill]` — использование `undefined` как индекса (TS2538);
   - строка 42: `new Date(user.createdAt)` — `createdAt` может быть `undefined` (TS2769);
   - строка 115: `excludeIds.includes(user.userSkill)` — `userSkill` может быть `undefined` (TS2345).
3. **Тесты `user/*` и `category.test.ts`** — значения `gender` в старом формате (`male`/`female`/`unspecified`), тогда как `TGender` теперь `"MALE" | "FEMALE" | "UNSPECIFIED"`; моки категорий не содержат новых полей `ISkillsCategory`.
4. **`auth`-логика**: `fetchProfile`/`fetchUpdateCurrentUser` переписаны под `IRealUserMeResponse` (без проверки токена в thunk), а `updateMyProfile` возвращает `IUserProfile` — стоит синхронизировать типы/документацию.

Рекомендация: завести отдельные задачи на исправление перечисленного и покрыть их тестами.