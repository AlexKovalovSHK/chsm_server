# Planning18: План реализации изоляции модуля Organization

> **Фаза 3: Planning** — декомпозиция фичи на конкретные, завершённые фазы.
> Каждая фаза = отдельный коммит, проверка и тест.

---

## Общая схема фаз

```
Фаза 1 ─── Фаза 2 ─── Фаза 3 ─── Фаза 4 ─── Фаза 5 ─── Фаза 6 ─── Фаза 7
Скелет      Data        Logic       API         Guard       Users       Final
модуля      layer       layer       layer       migrate     migrate     cleanup
```

**Легенда:**
- 🟢 — можно закоммитить после фазы
- 🧪 — можно протестировать (вручную или unit)
- ✅ — критерии проверки качества (гейт)

---

## Фаза 1: Скелет модуля + DTO + Интерфейсы + Mappers

**Длительность:** ~15-20 мин
**Суть:** Создать все «кирпичики» — файловую структуру, DTO, контракты, мапперы. Без бизнес-логики.

### Файлы для создания

```
src/organization/
├── interfaces/
│   ├── organization.repository.interface.ts
│   └── organization.service.interface.ts
├── dto/
│   ├── create-organization.dto.ts
│   ├── update-organization.dto.ts
│   ├── organization-list-query.dto.ts
│   ├── organization-response.dto.ts
│   ├── org-member-response.dto.ts
│   ├── add-user-to-org.dto.ts
│   └── update-user-role.dto.ts
├── mappers/
│   ├── organization.mapper.ts
│   └── org-member.mapper.ts
```

### Что делать

| # | Действие | Файл |
|---|----------|------|
| 1.1 | Создать `interfaces/` директорию | — |
| 1.2 | Описать `IOrganizationRepository` | `organization.repository.interface.ts` |
| 1.3 | Описать `IOrganizationService` | `organization.service.interface.ts` |
| 1.4 | Создать `dto/` директорию | — |
| 1.5 | Создать 7 DTO-файлов | `dto/*.ts` |
| 1.6 | Создать `mappers/` директорию | — |
| 1.7 | Реализовать `OrganizationMapper` (2 метода) | `mappers/organization.mapper.ts` |
| 1.8 | Реализовать `OrgMemberMapper` (2 метода) | `mappers/org-member.mapper.ts` |

### 🧪 Проверка (гейт 1.0)

```
🟢 Коммит: git add src/organization/interfaces/ src/organization/dto/ src/organization/mappers/
🟢 git commit -m "feat(org): add DTOs, interfaces and mappers for Organization module"
```

1. TypeScript компиляция: `npx tsc --noEmit` — ошибок нет
2. Все DTO экспортируют классы с корректными типами
3. Все мапперы — статические методы, принимают Prisma-типы, возвращают DTO
4. `OrgMemberMapper` использует `include: { user: { select: {...} } }`  — user-поля не нарушают инкапсуляцию

---

## Фаза 2: Data Layer — PrismaOrganizationRepository

**Длительность:** ~15-20 мин
**Суть:** Реализовать репозиторий, который ходит в БД через Prisma.

### Файлы для создания

```
src/organization/repositories/
└── prisma-organization.repository.ts
```

### Что делать

| # | Действие | Метод |
|---|----------|-------|
| 2.1 | Создать класс `PrismaOrganizationRepository implements IOrganizationRepository` | — |
| 2.2 | Реализовать `create()` | `prisma.organization.create` |
| 2.3 | Реализовать `findById()`, `findBySlug()` | `prisma.organization.findUnique` |
| 2.4 | Реализовать `findAll()` с фильтрацией search/plan + пагинация | `prisma.organization.findMany` |
| 2.5 | Реализовать `update()` | `prisma.organization.update` |
| 2.6 | Реализовать `delete()` | `prisma.organization.delete` |
| 2.7 | Реализовать `addMember()` | `prisma.orgMember.create + include user` |
| 2.8 | Реализовать `findMember()` | `prisma.orgMember.findUnique` по составному ключу |
| 2.9 | Реализовать `updateMemberRole()` | `prisma.orgMember.update + include user` |
| 2.10 | Реализовать `removeMember()` | `prisma.orgMember.delete` |
| 2.11 | Реализовать `getMembers()` | `prisma.orgMember.findMany + include user` |
| 2.12 | Реализовать `getMembersCount()` | `prisma.orgMember.count` |

### 🧪 Проверка (гейт 2.0)

```
🟢 Коммит: git add src/organization/repositories/
🟢 git commit -m "feat(org): implement PrismaOrganizationRepository"
```

1. `npx tsc --noEmit` — без ошибок
2. Все методы интерфейса реализованы (проверить в IDE — нет подчёркиваний)
3. Каждый OrgMember запрос использует `include: { user: { select: { id, mongoId, firstName, lastName, email } } }`
4. `removeMember` удаляет только по составному ключу `organizationId_userId`

---

## Фаза 3: Business Logic — OrganizationService

**Длительность:** ~15-20 мин
**Суть:** Сервис с бизнес-логикой: валидация, проверки, оркестрация, вызов мапперов.

### Файлы для создания

```
src/organization/
└── organization.service.ts
```

### Что делать

| # | Действие | Особенности |
|---|----------|-------------|
| 3.1 | Создать `OrganizationService implements IOrganizationService` | Inject `IOrganizationRepository` |
| 3.2 | Реализовать `getDefaultOrganization()` | Хардкод slug `'chsm_brass_eu'` (единственное место) |
| 3.3 | Реализовать `create()` | Проверка на дубликат slug → `ConflictException` |
| 3.4 | Реализовать `findById()`, `findBySlug()` | `NotFoundException` если не найдено |
| 3.5 | Реализовать `findAll()` | Прокси к репозиторию + маппер |
| 3.6 | Реализовать `update()` | Проверка существования → `NotFoundException` |
| 3.7 | Реализовать `delete()` | Проверка существования → `NotFoundException` |
| 3.8 | Реализовать `addUserToOrg()` | Проверка существования org → проверка дубликата member → `ConflictException` |
| 3.9 | Реализовать `updateUserRoleInOrg()` | Проверка членства → `NotFoundException` |
| 3.10 | Реализовать `removeUserFromOrg()` | Проверка членства → `NotFoundException` |
| 3.11 | Реализовать `getOrgMembers()` | Проверка существования org |
| 3.12 | Реализовать `getMember()` | Возвращает `null` если не найден (без exception) |
| 3.13 | Реализовать `isMember()` | Возвращает `boolean` |

### 🧪 Проверка (гейт 3.0)

```
🟢 Коммит: git add src/organization/organization.service.ts
🟢 git commit -m "feat(org): implement OrganizationService with business logic"
```

1. `npx tsc --noEmit` — без ошибок
2. `OrganizationService` не импортирует Prisma-типы напрямую (все через `IOrganizationRepository`)
3. Каждый метод, который может вернуть `null`, обработан:
   - `findById`, `findBySlug` → `NotFoundException`
   - `getMember` → `null` (без exception)
   - `isMember` → `boolean`
4. `defaultOrgSlug` — константа, не захардкожена в строках запросов

---

## Фаза 4: API Layer — Controller + Module

**Длительность:** ~10-15 мин
**Суть:** Контроллер, сборка модуля, регистрация в AppModule, тестирование эндпоинтов.

### Файлы для создания/изменения

```
Создать:
├── src/organization/organization.controller.ts
└── src/organization/organization.module.ts

Изменить:
└── src/organization/organization.module.ts    (заменить содержимое)
└── src/app.module.ts                           (добавить OrganizationModule в imports)
```

### Что делать

| # | Действие | Файл |
|---|----------|------|
| 4.1 | Создать `OrganizationController` с 10 эндпоинтами | `organization.controller.ts` |
| 4.2 | Реализовать `OrganizationModule` с import/export | `organization.module.ts` |
| 4.3 | Добавить `OrganizationModule` в imports `AppModule` (в `register()`) | `app.module.ts` |

### 🧪 Проверка (гейт 4.0)

```
🟢 Коммит: git add src/organization/organization.controller.ts src/organization/organization.module.ts
🟢 git commit -m "feat(org): add OrganizationController and register module"
```

#### Ручное тестирование эндпоинтов:

```bash
# 1. Создать организацию
curl -X POST http://localhost:3000/admin/organizations \
  -H "Content-Type: application/json" \
  -d '{"slug": "test-school", "name": "Test School", "plan": "free"}'
# → 201: { id, slug, name, plan, createdAt }

# 2. Получить список
curl http://localhost:3000/admin/organizations
# → 200: [{ id, slug, name, plan, createdAt }]

# 3. Получить по ID
curl http://localhost:3000/admin/organizations/<ID>
# → 200: { id, slug, name, ... }

# 4. Получить по slug
curl http://localhost:3000/admin/organizations/by-slug/test-school
# → 200: { id, slug, name, ... }

# 5. Обновить
curl -X PATCH http://localhost:3000/admin/organizations/<ID> \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated School"}'
# → 200: { id, slug, name: "Updated School", ... }

# 6. Добавить участника (userId = 1 — существующий в БД)
curl -X POST http://localhost:3000/admin/organizations/<ID>/members \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "role": "ADMIN"}'
# → 201: { id, organizationId, userId, role, userFirstName, ... }

# 7. Список участников
curl http://localhost:3000/admin/organizations/<ID>/members
# → 200: [{ id, userId, role, userFirstName, userLastName, userEmail }]

# 8. Сменить роль
curl -X PATCH http://localhost:3000/admin/organizations/<ID>/members/1/role \
  -H "Content-Type: application/json" \
  -d '{"role": "TEACHER"}'
# → 200: { id, userId, role: "TEACHER", ... }

# 9. Удалить участника
curl -X DELETE http://localhost:3000/admin/organizations/<ID>/members/1
# → 204

# 10. Удалить организацию
curl -X DELETE http://localhost:3000/admin/organizations/<ID>
# → 204

# 11. Edge case: дубликат slug
curl -X POST http://localhost:3000/admin/organizations \
  -H "Content-Type: application/json" \
  -d '{"slug": "test-school", "name": "Duplicate"}'
# → 409: Organization with slug "test-school" already exists

# 12. Edge case: несуществующий ID
curl http://localhost:3000/admin/organizations/non-existent-id
# → 404: Organization with ID "non-existent-id" not found
```

**Дополнительно:**
- Проверить `Content-Type: application/json` во всех POST/PATCH
- Проверить, что `ParseIntPipe` корректно обрабатывает `userId` в пути `/members/:userId`

---

## Фаза 5: Интеграция в MultiTenancyGuard

**Длительность:** ~10-15 мин
**Суть:** Заменить прямые вызовы `PrismaService` в `MultiTenancyGuard` на вызовы `OrganizationService`.

### Файлы для изменения

```
Изменить:
└── src/auth/guards/multi-tenancy.guard.ts
└── src/auth/auth.module.ts                 (импортировать OrganizationModule)
```

### Что делать

| # | Действие | Было | Стало |
|---|----------|------|-------|
| 5.1 | Добавить `OrganizationModule` в imports `AuthModule` | — | `imports: [..., OrganizationModule]` |
| 5.2 | Внедрить `OrganizationService` в `MultiTenancyGuard` | — | `constructor(private readonly orgService: OrganizationService)` |
| 5.3 | Заменить получение дефолтной организации | `this.prisma.organization.findUnique({ where: { slug: 'chsm_brass_eu' } })` | `this.orgService.getDefaultOrganization()` |
| 5.4 | Заменить получение member | `this.prisma.orgMember.findUnique(...)` + `this.prisma.user.findUnique(...)` | `this.orgService.isMember(orgId, userIntId)` |

### 🔄 Изменённая логика `canActivate()`

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const parentCanActivate = await super.canActivate(context);
  if (!parentCanActivate) return false;

  const request = context.switchToHttp().getRequest();
  const user = request.user as JwtPayload;
  let orgId: string = request.headers['x-org-id'];

  if (!orgId) {
    const defaultOrg = await this.orgService.getDefaultOrganization();
    orgId = defaultOrg.id;
  }

  if (!user || !user.userId) {
    throw new UnauthorizedException('User not found in request');
  }

  // user.userId — это mongoId → нужно получить Int userId
  const userRecord = await this.prisma.user.findUnique({
    where: { mongoId: user.userId },
    select: { id: true },
  });

  if (!userRecord) {
    throw new UnauthorizedException('User not found in database');
  }

  // ← ЗДЕСЬ ЗАМЕНА: используем orgService.isMember()
  const isMember = await this.orgService.isMember(orgId, userRecord.id);
  if (!isMember) {
    throw new ForbiddenException('You are not a member of this organization');
  }

  request.currentOrgId = orgId;
  return true;
}
```

### 🧪 Проверка (гейт 5.0)

```
🟢 Коммит: git add src/auth/guards/multi-tenancy.guard.ts src/auth/auth.module.ts
🟢 git commit -m "refactor(org): integrate OrganizationService into MultiTenancyGuard"
```

1. `npx tsc --noEmit` — без ошибок
2. Запрос без `x-org-id` → дефолтная организация (работает как раньше)
3. Запрос с `x-org-id` в котором пользователь НЕ состоит → `403 Forbidden`
4. Запрос с `x-org-id` в котором пользователь состоит → `200`
5. `PrismaService` больше НЕ используется в `MultiTenancyGuard` для работы с Organization/OrgMember

---

## Фаза 6: Интеграция в UsersModule

**Длительность:** ~15-20 мин
**Суть:** Заменить прямой upsert `OrgMember` в `PrismaUserRepository` и `updateOrgMemberRole()` на вызовы `OrganizationService`.

### Файлы для изменения

```
Изменить:
├── src/users/infrastructure/prisma-user.repository.ts
├── src/users/application/user.service.ts
└── src/users/users.module.ts                   (импортировать OrganizationModule)
```

### Что делать — 6А: PrismaUserRepository

| # | Действие | Было | Стало |
|---|----------|------|-------|
| 6.1 | Добавить `OrganizationModule` в imports `UsersModule` | — | `imports: [..., OrganizationModule]` |
| 6.2 | Внедрить `OrganizationService` в `PrismaUserRepository` | — | `constructor(private readonly orgService: OrganizationService)` |
| 6.3 | Заменить upsert OrgMember в `save()` | `this.prisma.orgMember.upsert(...)` | `this.orgService.addUserToOrg(...)` с обработкой `ConflictException` как upsert |
| 6.4 | Удалить метод `updateOrgMemberRole()` | 14 строк кода | Удалить из интерфейса и реализации |
| 6.5 | Удалить `getMembersCount()` если не используется | — | — |

### Что делать — 6Б: PrismaUserRepository (upsert логика)

```typescript
// Вместо:
await this.prisma.orgMember.upsert({
  where: { organizationId_userId: { userId: doc.id, organizationId: orgId } },
  update: {},
  create: { userId: doc.id, organizationId: orgId, role: 'STUDENT' },
});

// Стало:
const org = organizationId
  ? await this.orgService.findById(organizationId)
  : await this.orgService.getDefaultOrganization();

try {
  await this.orgService.addUserToOrg(org.id, { userId: doc.id, role: 'STUDENT' });
} catch (err) {
  // ConflictException = уже участник — это нормально для upsert
  if (!(err instanceof ConflictException)) {
    throw err;
  }
}
```

### Что делать — 6В: UserService

| # | Действие | Было | Стало |
|---|----------|------|-------|
| 6.6 | Внедрить `OrganizationService` в `UserService` | — | `constructor(private readonly orgService: OrganizationService)` |
| 6.7 | Заменить вызов в `changeRole()` | `await this.repo.updateOrgMemberRole(id, organizationId, role)` | `await this.orgService.updateUserRoleInOrg(organizationId, userIntId, { role })` |

**Проблема:** `UserService.changeRole()` принимает `id = mongoId`, а `OrganizationService.updateUserRoleInOrg()` требует `userId = User.id (Int)`.

**Решение:** Добавить шаг преобразования mongoId → Int:

```typescript
async changeRole(id: string, role: string, organizationId?: string): Promise<UserResponseDto> {
  const user = await this.repo.findById(id);
  if (!user) throw new NotFoundException('Пользователь не найден');

  user.changeRole(UserRole.fromString(role));
  const saved = await this.repo.save(user, organizationId);

  // Синхронизируем роль в OrgMember через OrganizationService
  if (organizationId) {
    // Преобразуем mongoId → Int id
    await this.orgService.updateUserRoleInOrg(organizationId, parseInt(id), { role: role.toUpperCase() as any });
  }

  return UserMapper.toResponseDto(saved);
}
```

> **Примечание:** `parseInt(id)` работает, потому что mongoId — это строка ObjectId MongoDB, а `User.id` — Int. Нужно быть уверенным, что `id` — это Int, или добавить отдельный lookup.

**Альтернатива (лучше):** Добавить в `OrganizationService` метод, который принимает mongoId:

```typescript
async updateUserRoleByMongoId(mongoId: string, organizationId: string, role: string): Promise<OrgMemberResponseDto> {
  // Найти User по mongoId → получить Int id
  const user = await this.prisma.user.findUnique({
    where: { mongoId },
    select: { id: true },
  });
  if (!user) throw new NotFoundException('User not found');
  return this.updateUserRoleInOrg(organizationId, user.id, { role: role as any });
}
```

### 🧪 Проверка (гейт 6.0)

```
🟢 Коммит: git add src/users/ src/prisma/
🟢 git commit -m "refactor(org): integrate OrganizationService into UsersModule"
```

1. `npx tsc --noEmit` — без ошибок
2. Создать нового пользователя → OrgMember создаётся автоматически (через OrganizationService)
3. Сменить роль пользователю через `PATCH /api/users/:id/role` → роль меняется и в `User.role` и в `OrgMember.role`
4. Удалить пользователя → OrgMember удаляется каскадно
5. `IUserRepository` больше не содержит методов `save()` с OrgMember-логикой / `updateOrgMemberRole()`
6. `PrismaUserRepository` не импортирует `OrgMemberRole` из Prisma

---

## Фаза 7: Финал — Удаление дублей + Дополнения

**Длительность:** ~10-15 мин
**Суть:** Очистка старого кода, удаление прямых обращений к `prisma.organization` и `prisma.orgMember` из всех модулей, удаление хардкода.

### Что делать

| # | Действие | Файл |
|---|----------|------|
| 7.1 | Удалить `IUserRepository.updateOrgMemberRole()` | `src/users/domain/user.repository.interface.ts` |
| 7.2 | Удалить `PrismaUserRepository.updateOrgMemberRole()` | `src/users/infrastructure/prisma-user.repository.ts` |
| 7.3 | Удалить `PrismaUserRepository.save()` upsert-логику (оставить только user upsert) | `src/users/infrastructure/prisma-user.repository.ts` |
| 7.4 | Проверить, нет ли в других сервисах прямых `prisma.organization.*` или `prisma.orgMember.*` | Все сервисы |
| 7.5 | Заменить хардкод `'chsm_brass_eu'` везде, кроме `OrganizationService` | `multi-tenancy.guard.ts`, `prisma-user.repository.ts` (после миграции — удалён) |
| 7.6 | (Опционально) Добавить `@UseGuards(JwtAuthGuard)` или `@Roles('super-admin')` в контроллер | `organization.controller.ts` |

### 🔍 Поиск оставшихся хардкодов

```bash
grep -rn "chsm_brass_eu" src/ --include="*.ts"
# Ожидаемый результат: только в src/organization/organization.service.ts
```

```bash
grep -rn "prisma.organization\|prisma.orgMember" src/ --include="*.ts"
# Ожидаемый результат: только в src/organization/repositories/prisma-organization.repository.ts
```

### 🧪 Проверка (гейт 7.0)

```
🟢 Коммит: git add -A
🟢 git commit -m "refactor(org): final cleanup - remove duplicated OrgMember logic and hardcoded slug"
```

1. `npx tsc --noEmit` — без ошибок
2. `grep -rn "chsm_brass_eu" src/` → только `src/organization/organization.service.ts`
3. `grep -rn "prisma\.organization\|prisma\.orgMember" src/` → только `src/organization/repositories/prisma-organization.repository.ts`
4. Полный цикл тестирования:
   - Создать суперадминистратором новую организацию
   - Добавить пользователя в организацию
   - Выполнить запрос с `x-org-id` к любому защищённому эндпоинту → успех
   - Сменить роль пользователю
   - Удалить пользователя из организации
5. Все старые тесты проходят (если есть)

---

## Сводка коммитов

| Фаза | Коммит | Затронутые файлы |
|------|--------|-----------------|
| 1 | `feat(org): add DTOs, interfaces and mappers for Organization module` | 9 новых файлов |
| 2 | `feat(org): implement PrismaOrganizationRepository` | 1 новый файл |
| 3 | `feat(org): implement OrganizationService with business logic` | 1 новый файл |
| 4 | `feat(org): add OrganizationController and register module` | 2 новых + 1 изменённый |
| 5 | `refactor(org): integrate OrganizationService into MultiTenancyGuard` | 2 изменённых файла |
| 6 | `refactor(org): integrate OrganizationService into UsersModule` | 3 изменённых файла |
| 7 | `refactor(org): final cleanup - remove duplicated OrgMember logic` | 3-5 изменённых файлов |

---

## Диаграмма зависимостей фаз

```
Фаза 1 (DTO+Interfaces+Mappers)
    │
    ▼
Фаза 2 (Repository) ─── зависит от: Interfaces
    │
    ▼
Фаза 3 (Service) ─────── зависит от: Interfaces, Repository, Mappers
    │
    ▼
Фаза 4 (Controller+Module) ─── зависит от: Service, DTO
    │
    ▼
Фаза 5 (Guard) ───────── зависит от: Module (экспорт Service)
    │
    ▼
Фаза 6 (User Module) ─── зависит от: Module (экспорт Service)
    │
    ▼
Фаза 7 (Cleanup) ─────── зависит от: всех предыдущих
```

**Параллельные возможности:**
- Фазы 1 → 2 → 3 → 4 строго последовательны
- Фазы 5 и 6 можно выполнять параллельно (разные модули)
- Фаза 7 — только после 5 и 6

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| `parseInt(mongoId)` даст NaN при конвертации mongoId→Int | Высокая | Добавить отдельный метод `updateUserRoleByMongoId()` с Prisma-запросом |
| Null/undefined `currentOrgId` в конструкторах сервисов | Средняя | После внедрения `OrganizationService` в `MultiTenancyGuard` — `request.currentOrgId` продолжает проставляться как и раньше |
| Кольцевая зависимость модулей (AuthModule ↔ OrganizationModule ↔ UsersModule) | Низкая | `OrganizationModule` не импортирует ни `AuthModule`, ни `UsersModule` — только `PrismaModule` |
| `OrgMember` создаётся дважды (в старом коде и новом) | Средняя | Фаза 6 явно удаляет старый upsert-код; коммит проверяет grep |
