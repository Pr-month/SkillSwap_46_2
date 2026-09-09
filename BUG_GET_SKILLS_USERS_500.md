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

## Затронутый код
- `backend/src/skills/skills.service.ts` → метод `findAll()` (использует `createQueryBuilder` с `select` + `leftJoinAndSelect('user.wantToLearn')` / `user.city`).
- `backend/src/users/users.service.ts` → метод `findAll()` (использует `findAndCount` с `select` перечнем полей).

## Вероятные причины (нужно подтвердить по стеку)
Причина в коде сервисов, а не в данных/CI. Кандидаты:
1. **`SkillsService.findAll`**: конфликт между `.select([...])` и `.leftJoinAndSelect('user.city'/'user.wantToLearn')` в одном `createQueryBuilder`, из-за чего генерируется некорректный SQL (или обращение к `skill.user.wantToLearn.map(...)`, если связь приходит как `null`).
2. **`UsersService.findAll`**: `findAndCount` с `select` по полям (`gender`, `role`, `birthdate`) может спотыкаться на enum/отношениях; возможно нужны `relations` или другой способ выборки.

## Как воспроизвести
```bash
cd backend
npm run test:e2e:all   # требуется тестовая БД skillswap_test (см. .env.test.local.example)
```

## Рекомендация по диагностике
1. Включить вывод стека ошибки: во время прогона посмотреть тело 500 (например, временно залогировать `error.stack` во `AllExceptionFilter`, или в тесте вывести `res.body`/`res.error` вместо `expect(200)`).
2. Запустить `GET /skills` и `GET /users` вручную против тестовой БД и посмотреть реальное сообщение об ошибке.
3. Исправить соответствующий `findAll`, затем повторно прогнать `npm run test:e2e:all`.

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