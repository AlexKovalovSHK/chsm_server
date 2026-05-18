# Research18: Модуль Organization (Multi-Tenancy)

> **Фаза 1: Research** — факты и связи «как есть» (as is), без советов.

---

## 1. Общая архитектура мультиарендности (Multi-Tenancy)

Система использует модель **один сервис — много организаций (школ)**. Изоляция данных осуществляется на уровне БД через `organizationId` — UUID, который пробрасывается во все запросы через HTTP-заголовок `x-org-id`.

**Схема отношений:**

```
Organization (1) ──┐
                   ├── OrgMember ── User (M)
                   ├── Student (M)
                   ├── AcademicYear (M)
                   ├── SessionLevel (M)
                   ├── SessionRun (M)
                   └── Practice (M)
```

Один пользователь может состоять в нескольких организациях через связующую таблицу `OrgMember`.

---

## 2. Prisma schema: модели данных

**Файл:** `chsm_classroom_integrations/prisma/schema.prisma#L1-142`

### 2.1. Модель `Organization` (#L74-86)

```prisma
model Organization {
  id                String   @id @default(uuid()) @db.Uuid
  slug              String   @unique // "chsm", "school-moscow"
  name              String
  domain            String?  @unique // "chsm.pro"
  googleWorkspaceId String?  @map("google_workspace_id")
  classroomConfig   Json?    @map("classroom_config")
  telegramBotToken  String?  @map("telegram_bot_token")
  plan              String   @default("free")
  settings          Json     @default("{}")
  createdAt         DateTime @default(now()) @map("created_at")

  members       OrgMember[]
  students      Student[]
  academicYears AcademicYear[]
  sessionLevels SessionLevel[]
  sessionRuns   SessionRun[]
  practices     Practice[]

  @@map("organizations")
}
```

**Поля:**
- `slug` — уникальный идентификатор (человекочитаемый), используется для определения организации по умолчанию
- `domain` — опциональный домен для автоопределения
- `googleWorkspaceId` — домен Google Workspace школы
- `classroomConfig` — зашифрованные OAuth-токены для Google Classroom
- `telegramBotToken` — токен своего Telegram-бота для организации
- `plan` — тарифный план (`free`, `pro`, `enterprise`)
- `settings` — произвольные настройки (JSON)

### 2.2. Модель `OrgMember` — связь User ↔ Organization (#L88-98)

```prisma
enum OrgMemberRole {
  OWNER
  ADMIN
  TEACHER
  STUDENT
  VIEWER
}

model OrgMember {
  id             String        @id @default(uuid()) @db.Uuid
  organizationId String        @map("organization_id") @db.Uuid
  userId         Int           @map("user_id")
  role           OrgMemberRole @default(VIEWER)
  createdAt      DateTime      @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@map("org_members")
}
```

**Важные детали:**
- `OrgMember.userId` — это `Int` (автоинкрементный `User.id` в БД)
- `User.mongoId` — это строка (MongoDB ObjectId), именно он используется в JWT-токене как `sub`
- При поиске членства в организации происходит двойной запрос: `mongoId` → `User.id` (Int) → поиск `OrgMember`

**OrgMemberRole** — enum с ролями: `OWNER`, `ADMIN`, `TEACHER`, `STUDENT`, `VIEWER`

**Уникальность:** составной ключ `@@unique([organizationId, userId])` гарантирует, что пользователь может иметь только одну роль в организации.

---

## 3. Модуль `OrganizationModule` — текущее состояние

**Файл:** `chsm_classroom_integrations/src/organization/organization.module.ts`

Модуль **пустой** — не содержит:
- Ни одного контроллера
- Ни одного сервиса
- Ни одного DTO

**Директории:**
- `src/organization/controllers/` — пусто
- `src/organization/service/` — пусто
- `src/organization/dto/` — пусто

**Импорт:** модуль **НЕ импортируется** в `AppModule` (согласно grep, ни один файл не импортирует `organization.module`).

---

## 4. MultiTenancyGuard — центральный guard изоляции

**Файл:** `chsm_classroom_integrations/src/auth/guards/multi-tenancy.guard.ts#L1-74`

### 4.1. Наследование

```
JwtAuthGuard → AdminAndTeacherGuard → MultiTenancyGuard
```

- `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts#L1-30`) — проверяет JWT-токен через Passport (`passport-jwt`)
- `AdminAndTeacherGuard` (`src/auth/guards/admin_and_teacher.guard.ts#L1-49`) — проверяет роли (по умолчанию `admin`/`teacher`, можно переопределить через `@Roles()`)
- `MultiTenancyGuard` — добавляет проверку членства в организации

### 4.2. Логика работы `canActivate()` (#L17-74)

```
1. Вызов super.canActivate() — JWT-аутентификация + проверка ролей
2. Чтение orgId из заголовка `x-org-id`
3. Если заголовок отсутствует → поиск организации по slug 'chsm_brass_eu' (дефолтная)
4. Извлечение user.userId из JWT-пayload (это mongoId — строка)
5. Поиск User в БД по mongoId → получение Int id (userRecord.id)
6. Поиск OrgMember по составному ключу [organizationId, userId]
7. Если членство не найдено → ForbiddenException
8. Установка request.currentOrgId = orgId
9. Возврат true
```

### 4.3. Ключи декораторов

- `@Public()` — маршрут без аутентификации (`src/auth/decorators/public.decorator.ts`)
- `@Roles('admin', 'teacher', 'student')` — разрешённые роли (`src/auth/decorators/roles.decorator.ts`)
- `@UseGuards(MultiTenancyGuard)` — применяет гвард к контроллеру

### 4.4. Применение в контроллерах

MultiTenancyGuard используется в **11 модулях**:

| Модуль | Контроллер |
|--------|-----------|
| Enrollment | `enrollment.controller.ts`, `enrollment.controller_v2.ts` |
| Grade | `grade.controller.ts` |
| GradeEntry | `grade-entry.controller.ts` |
| Gradebook | `gradebook.controller.ts` |
| Practice | `practices.controller.ts` |
| AcademicYear | `academic-year.controller.ts` |
| SessionLevel | `session-level.controller.ts` |
| SessionRun | `session-run.controller.ts` |
| Student | `student.controller.ts`, `student.controller_v2.ts` |
| Subject | `subject.controller.ts`, `subject.controller_v2.ts` |
| User | `user.controller.ts` (только `changeRole`) |

**Не используют MultiTenancyGuard:**
- `AuthController` — публичные эндпоинты логина
- `UserController` (эндпоинты с `JwtAuthGuard`) — получение списка пользователей, me, update (без привязки к организации)

---

## 5. Паттерн получения `currentOrgId` в сервисах

Каждый сервис, работающий с организацией, получает `currentOrgId` одинаковым способом — через инъекцию объекта `REQUEST` из `@nestjs/core`:

```typescript
@Injectable()
export class SomeService {
  private readonly currentOrgId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.currentOrgId = this.request.currentOrgId as string;
  }
}
```

**Сервисы, использующие этот паттерн:**
- `PracticesService` (`src/practices/practices.service.ts#L16-21`)
- `AcademicYearService` (`src/sessions/academic_years/service/academic-year.service.ts#L14-19`)
- `SessionLevelService`
- `SessionRunService`
- `StudentService` (`src/students/application/student.service.ts#L18-23`)
- `SubjectService`
- `EnrollmentService`
- `GradeService`
- `GradeEntryService`
- `GradebookService`

**Проблема:** `currentOrgId` инициализируется в конструкторе, который вызывается один раз при создании синглтона. Для request-scoped провайдеров это работает корректно, но для обычных синглтонов — значение будет захвачено при первом запросе и останется неизменным.

---

## 6. User ↔ Organization: связь со стороны User

### 6.1. Создание OrgMember при сохранении пользователя

**Файл:** `chsm_classroom_integrations/src/users/infrastructure/prisma-user.repository.ts#L97-124`

Метод `save()` выполняет:
1. Upsert пользователя в таблицу `User` (по `mongoId`)
2. Upsert записи в `OrgMember`:
   - Если передан `organizationId` — использует его
   - Если не передан — ищет организацию по slug `'chsm_brass_eu'` (дефолтная)
   - Создаёт OrgMember с ролью `STUDENT`, если записи нет
   - Если уже есть — ничего не меняет (update: {})

```typescript
await this.prisma.orgMember.upsert({
  where: { organizationId_userId: { userId: doc.id, organizationId: orgId } },
  update: {},
  create: { userId: doc.id, organizationId: orgId, role: 'STUDENT' },
});
```

### 6.2. Привязка пользователя к организации при создании

**В DTO:** `src/users/application/dto/new-user.dto.ts#L44-48`
```typescript
organizationId?: string; // опционально, по умолчанию дефолтная
```

**В сервисах создания пользователя:**
- `UserService.create()` — передаёт `dto.organizationId` в `repo.save()`
- `TgInternalService.syncUserData()` — извлекает `organizationId` из DTO и передаёт в `UserService.create()` или `UserService.update()`

### 6.3. Изменение роли в OrgMember

**Файл:** `chsm_classroom_integrations/src/users/application/user.service.ts#L84-98`

Метод `changeRole()`:
1. Меняет роль в сущности `User`
2. Сохраняет пользователя (создаёт OrgMember, если нет)
3. Если передан `organizationId` — вызывает `updateOrgMemberRole()`

**Метод `updateOrgMemberRole()` в PrismaUserRepository:**
```typescript
async updateOrgMemberRole(userMongoId: string, organizationId: string, role: string): Promise<void>
```
- Ищет `User` по `mongoId` → получает Int `id`
- Делает `updateMany` на `OrgMember` по `[userId, organizationId]`
- Роль конвертируется в uppercase

### 6.4. Использование в контроллере

`UserController.changeRole()` (#L208-225):
```typescript
@Patch(':id/role')
@UseGuards(MultiTenancyGuard)
@Roles('admin')
async changeRole(@Param('id') id: string, @Body('role') role: string, @Req() req: Request) {
  const orgId = (req as any).currentOrgId;
  return this.userService.changeRole(id, role, orgId);
}
```

### 6.5. Доменная сущность User (DDD)

**Файл:** `chsm_classroom_integrations/src/users/domain/user.entity.ts`

- Поля сущности **не содержат** `organizationId` или `orgMemberships`
- `User` — чистая доменная сущность (DDD), без знаний об организации
- Связь с организацией — исключительно на уровне репозитория (`PrismaUserRepository`)

---

## 7. JWT-аутентификация и роль пользователя

### 7.1. JWT Payload

```typescript
// JwtStrategy.validate() возвращает:
interface JwtPayload {
  userId: string;  // = sub = User.mongoId
  role: string;    // = User.role (поле role из таблицы users)
}
```

**Файлы:**
- `src/auth/strategies/jwt.strategy.ts#L25-30`
- `src/auth/decorators/current-user.decorator.ts#L3-6`

### 7.2. Создание токена

**AuthService.login():**
```typescript
const payload = { sub: user.id.toString(), role: user.role.toString() };
const accessToken = this.jwtService.sign(payload);
```

- `sub` = `User.id` (автоинкрементный Int) — не `mongoId`!
- Но JwtStrategy возвращает `userId: payload.sub` (Int как строка)
- MultiTenancyGuard ожидает `user.userId` как `mongoId` (строка ObjectId)

**Потенциальное рассогласование:** `AuthService` кладёт в `sub` значение `User.id` (Int, автоинкремент), а MultiTenancyGuard трактует `user.userId` как `mongoId`. Возможны баги.

---

## 8. Изоляция данных по организации в сервисах

Все сервисы следуют одному паттерну:

### 8.1. При создании — передача `organizationId` в данные

```typescript
// AcademicYearService.create()
data: { ...dto, organizationId: this.currentOrgId }

// PracticesService.create()
data: { studentId, practiceType, organizationId: this.currentOrgId }
```

### 8.2. При чтении — фильтрация по `organizationId`

```typescript
// findAll
where: { organizationId: this.currentOrgId }

// findOne
where: { id, organizationId: this.currentOrgId }
```

### 8.3. При обновлении/удалении — проверка `organizationId`

```typescript
update({ where: { id, organizationId: this.currentOrgId }, data: dto })
delete({ where: { id, organizationId: this.currentOrgId } })
```

### 8.4. Для связанных сущностей — через вложенные модели

Для сущностей без прямого `organizationId` (например, `GradeEntry`, `Enrollment`, `Gradebook`) изоляция идёт через цепочку связей:

```typescript
// Enrollment → Student → organizationId
where: { student: { organizationId: this.currentOrgId } }

// GradeEntry → Enrollment → Student → organizationId
where: { enrollment: { student: { organizationId: this.currentOrgId } } }

// Subject → SessionRun → organizationId
where: { sessionRun: { organizationId: this.currentOrgId } }
```

---

## 9. Организация по умолчанию

Хардкод slug: `'chsm_brass_eu'` используется в:
1. `MultiTenancyGuard.canActivate()` (#L34-42) — если нет `x-org-id`
2. `PrismaUserRepository.save()` (#L112-115) — если не передан `organizationId`

---

## 10. User ↔ Organization: полный граф связей

```
JWT: { sub: User.id (Int), role: User.role (string) }
   ↓
MultiTenancyGuard читает user.userId (= sub = Int)
   ↓ (НО трактует как mongoId)
User.findUnique({ where: { mongoId: user.userId } })
   ↓
Получает userRecord.id (Int)
   ↓
OrgMember.findUnique({ where: { organizationId_userId: { userId: userRecord.id, organizationId: orgId } } })
```

**Прямые связи между модулями:**

| Через | Тип связи |
|-------|-----------|
| `User.id` (Int) ↔ `OrgMember.userId` (Int) | Прямая FK |
| `User.mongoId` (String) ↔ `Student.userId` (String) | Прямая (не FK в БД) |
| `User.mongoId` (String) = JWT `sub` (когда через AuthService использует Int) | **Непрямая/потенциально проблемная** |

---

## 11. Модули, НЕ связанные с многотеначностью

- `ClassroomModule` — интеграция с Google Classroom (работает через Google API, использует токены администратора)
- `TelegramModule` — Telegram-боты
- `BackupModule` — бэкапы
- `McpModule` / `McpSmModule` — MCP (Model Context Protocol) для AI-интеграций

---

## 12. Файловая структура модулей с multi-tenancy

```
src/
├── auth/
│   ├── guards/
│   │   ├── multi-tenancy.guard.ts     ← Центральный guard multi-tenancy
│   │   ├── admin_and_teacher.guard.ts
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts  ← JwtPayload интерфейс
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── organization/                      ← ПУСТОЙ модуль
│   └── organization.module.ts
├── users/
│   ├── infrastructure/
│   │   └── prisma-user.repository.ts  ← Создание OrgMember при save()
│   └── application/
│       └── user.service.ts            ← changeRole() с синхронизацией OrgMember
└── *domain services*                  ← Все используют @Inject(REQUEST)
```

---

## 13. Резюме: ключевые выводы

1. **Модуль `OrganizationModule` — пустой и не используется.** Вся логика организации распределена по `MultiTenancyGuard` (в `auth`) и в каждом сервисе индивидуально.

2. **Два идентификатора пользователя:** `User.id` (Int, автоинкремент) и `User.mongoId` (строка). JWT может содержать оба — в зависимости от того, какой сервис его создал. Это создаёт потенциальный баг.

3. **OrgMember создаётся автоматически** в `PrismaUserRepository.save()` при любом сохранении пользователя (upsert). Это единственная точка создания.

4. **Роли дублируются:** `User.role` (String: "admin", "teacher", "student") и `OrgMember.role` (Enum: OWNER, ADMIN, TEACHER, STUDENT, VIEWER). Синхронизация происходит только в `UserService.changeRole()`.

5. **Дефолтная организация** захардкожена через slug `'chsm_brass_eu'` в двух местах.

6. **Каждый сервис сам заботится об изоляции данных** через `currentOrgId`, получаемый из request-scoped инъекции.
