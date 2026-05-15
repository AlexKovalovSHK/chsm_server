# Практики (Practice) — Документация для фронтенда

## 📋 Обзор

Система управления практиками в музыкальной школе. Студент заполняет журнал практик (богослужебная или педагогическая), а администратор одобряет каждую запись отдельно.

У каждого **зачисления (Enrollment)** может быть максимум **два журнала** — один богослужебный (`LITURGICAL`) и один педагогический (`PEDAGOGICAL`). Попытка создать дубликат приведёт к ошибке.

---

## 🔐 Права доступа (RBAC)

| Роль | Журналы практик | Записи в журнале |
|------|----------------|------------------|
| **`admin`** | Полный доступ ко всем журналам всех студентов | Полный доступ, включая одобрение записей |
| **`teacher`** | Полный доступ ко всем журналам всех студентов | Полный доступ, включая одобрение записей |
| **`student`** | ❗ Только свои журналы (через свои enrollment) | ❗ Только свои записи. **Не может одобрять** |

### Правила для студента

1. **Создать журнал** — только если `enrollmentId` принадлежит самому студенту (иначе `403 Forbidden`)
2. **Просмотр/изменение/удаление** — только своих журналов и записей
3. **Список (`GET /practices`)** — если не указан `enrollmentId`, вернутся все практики студента по всем его зачислениям
4. **Одобрение записи** (`/approve`) — **запрещено** (`403 Forbidden`)

### Правила для админа/учителя

- Полный доступ ко всем данным
- `enrollmentId` в `GET /practices` — опциональный фильтр

### Ошибка доступа

```typescript
// HTTP 403 Forbidden
{
  "message": "You do not have access to this practice journal",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

## 🧱 Модели данных (DTO)

### PracticeDto — журнал практики

```typescript
export interface PracticeDto {
  id: string;                    // UUID
  enrollmentId: string;          // UUID зачисления
  practiceType: 'LITURGICAL' | 'PEDAGOGICAL';
  practiceStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  entries?: PracticeEntryDto[];  // Записи (только при запросе одного журнала)
}
```

### PracticeEntryDto — запись в журнале

```typescript
export interface PracticeEntryDto {
  id: string;                    // UUID
  practiceId: string;            // UUID журнала
  title: string;                 // Название/описание
  serviceKind: string | null;    // Вид служения (только LITURGICAL)
  location: string | null;       // Место прохождения (только PEDAGOGICAL)
  date: string;                  // Дата в формате ISO (YYYY-MM-DD)
  approvedAt: string | null;     // Дата одобрения ISO (null = не одобрена)
  approvedBy: string | null;     // Кто одобрил (имя/ID админа)
}
```

---

## 🔌 API Endpoints

### 1. Журналы практик (Practices)

#### POST `/practices` — Создать журнал практики

```typescript
// Request Body
{
  enrollmentId: string;   // UUID существующего зачисления
  practiceType: 'LITURGICAL' | 'PEDAGOGICAL';
}

// Response (201 Created)
interface Response extends PracticeDto {}
```

**Ошибки:**
- `409 Conflict` — журнал такого типа для данного enrollment уже существует
- `403 Forbidden` — студент пытается создать журнал для чужого enrollment
- `400 Bad Request` — передан неверный `practiceType`

---

#### GET `/practices?enrollmentId=UUID` — Получить все журналы зачисления

```typescript
// Query params
enrollmentId: string;  // обязательный

// Response (200 OK)
interface Response extends Array<PracticeDto> {}
```

> 💡 Примечание: у одного enrollment максимум 2 журнала (один `LITURGICAL`, один `PEDAGOGICAL`).

---

#### GET `/practices/:id` — Получить журнал с записями

```typescript
// Response (200 OK)
interface Response extends PracticeDto {
  entries: PracticeEntryDto[];  // Вложенный массив записей
}
```

**Ошибки:**
- `404 Not Found` — журнал не найден
- `403 Forbidden` — студент пытается получить доступ к чужому журналу

---

#### PATCH `/practices/:id` — Обновить статус журнала

```typescript
// Request Body
{
  practiceStatus?: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

// Response (200 OK)
interface Response extends PracticeDto {}
```

**Ошибки:**
- `404 Not Found` — журнал не найден
- `403 Forbidden` — студент пытается обновить чужой журнал

---

#### DELETE `/practices/:id` — Удалить журнал

```typescript
// Response (200 OK) — тело ответа пустое
// Все связанные записи удаляются каскадно
```

**Ошибки:**
- `404 Not Found` — журнал не найден
- `403 Forbidden` — студент пытается удалить чужой журнал

---

### 2. Записи в журнале (Practice Entries)

#### POST `/practices/:practiceId/entries` — Добавить запись

**Валидация полей зависит от типа журнала:**

| Тип журнала | Обязательно | Игнорируется |
|-------------|------------|--------------|
| `LITURGICAL` | `title`, `date`, **`serviceKind`** | `location` |
| `PEDAGOGICAL` | `title`, `date`, **`location`** | `serviceKind` |

```typescript
// Request Body
{
  title: string;          // Название практики
  serviceKind?: string;   // Вид служения (только для LITURGICAL)
  location?: string;      // Место (только для PEDAGOGICAL)
  date: string;           // ISO date string, e.g. "2023-10-25T00:00:00Z"
}

// Response (201 Created)
interface Response extends PracticeEntryDto {}
```

**Ошибки:**
- `404 Not Found` — журнал `practiceId` не найден
- `403 Forbidden` — студент пытается добавить запись в чужой журнал
- `400 Bad Request` — не указано обязательное поле (serviceKind/location)

**Пример запроса (LITURGICAL):**

```json
{
  "title": "Утренняя служба",
  "serviceKind": "Литургия",
  "date": "2023-11-15T00:00:00Z"
}
```

**Пример запроса (PEDAGOGICAL):**

```json
{
  "title": "Урок сольфеджио",
  "location": "ДМШ №1, каб. 12",
  "date": "2023-11-15T00:00:00Z"
}
```

---

#### GET `/practices/:practiceId/entries` — Получить все записи журнала

```typescript
// Response (200 OK)
interface Response extends Array<PracticeEntryDto> {}
```

**Ошибки:**
- `404 Not Found` — журнал не найден
- `403 Forbidden` — студент пытается посмотреть записи чужого журнала

---

#### PATCH `/practices/:practiceId/entries/:id` — Обновить запись

```typescript
// Request Body (все поля опциональны)
{
  title?: string;
  serviceKind?: string;   // Работает только для LITURGICAL
  location?: string;      // Работает только для PEDAGOGICAL
  date?: string;
}

// Response (200 OK)
interface Response extends PracticeEntryDto {}
```

**Ошибки:**
- `404 Not Found` — журнал или запись не найдены
- `403 Forbidden` — студент пытается обновить запись в чужом журнале
- `400 Bad Request` — `serviceKind` передан для `PEDAGOGICAL` или `location` для `LITURGICAL`

---

#### PATCH `/practices/:practiceId/entries/:id/approve` — Одобрить запись

```typescript
// Request Body (опционально)
{
  approvedBy?: string;  // Имя или ID администратора (если не указан — 'system')
}

// Response (200 OK) — у записи проставляются approvedAt и approvedBy
interface Response extends PracticeEntryDto {}
```

**Ошибки:**
- `403 Forbidden` — студент не может одобрять записи
- `404 Not Found` — запись не найдена
- `400 Bad Request` — запись уже одобрена (сообщение: `"Already approved"`)

> ⚠️ **Важно:** после одобрения изменить или удалить запись нельзя. Проверяйте `approvedAt` на фронте и блокируйте кнопки редактирования/удаления.

---

#### DELETE `/practices/:practiceId/entries/:id` — Удалить запись

```typescript
// Response (200 OK)
```

**Ошибки:**
- `404 Not Found` — запись не найдена
- `403 Forbidden` — студент пытается удалить запись из чужого журнала

---

## 🎯 UI/UX Рекомендации

### Экран списка практик (по enrollment)

```
┌─────────────────────────────────────┐
│  Журналы практик                    │
├─────────────────────────────────────┤
│  📖 Богослужебная практика          │
│  Статус: ✅ Подтверждён             │
│  Записей: 8 из 10                   │
│  [Открыть →]                        │
├─────────────────────────────────────┤
│  📚 Педагогическая практика         │
│  Статус: 📝 Черновик                │
│  Записей: 3 из 10                   │
│  [Открыть →]                        │
├─────────────────────────────────────┤
│  [➕ Создать журнал практики]        │
│  (disabled, если уже 2 журнала)     │
└─────────────────────────────────────┘
```

- Если у enrollment ещё нет журнала какого-то типа — показывайте кнопку "Создать"
- Если оба журнала уже существуют — кнопка создания неактивна

### Экран журнала со списком записей

```
┌─────────────────────────────────────┐
│  ← Назад • Богослужебная практика   │
│  Статус: 📝 Черновик                │
│  [Изменить статус]                  │
├─────────────────────────────────────┤
│  📅 15.11.2023 — Утренняя служба    │
│     Вид: Литургия                   │
│     Одобрено: Администратор         │
│     [✏️] [🗑] [✅]                   │
├─────────────────────────────────────┤
│  📅 10.11.2023 — Вечерняя служба    │
│     Вид: Всенощная                  │
│     ❌ Не одобрена                  │
│     [✏️] [🗑] [✅ Одобрить]          │
├─────────────────────────────────────┤
│  [➕ Добавить запись]                │
└─────────────────────────────────────┘
```

### Поведение элементов управления (для каждой записи)

| Состояние записи | ✏️ Редактировать | 🗑 Удалить | ✅ Одобрить |
|-----------------|:---:|:---:|:---:|
| Не одобрена | ✅ | ✅ | ✅ |
| Одобрена | ❌ | ❌ | ❌ |

---

## 🚦 Статусы журнала практики

| Статус | Описание | Действия пользователя |
|--------|----------|----------------------|
| `DRAFT` | Черновик — студент редактирует | Можно добавлять/изменять записи |
| `SUBMITTED` | Отправлен на проверку | Редактирование заблокировано, ожидает админа |
| `APPROVED` | Утверждён администратором | Все записи одобрены, журнал закрыт |

---

## ⚠️ Типичные ошибки и их обработка

```typescript
interface ApiError {
  message: string;
  error: string;    // Тип ошибки (например, "Conflict", "Not Found")
  statusCode: number;
}

// Статус-коды:
// 400 - Bad Request (невалидные данные, неверный тип)
// 404 - Not Found (журнал или запись не найдены)
// 409 - Conflict (дубликат журнала практики)
```

### Пример обработки на фронте:

```typescript
import { createPractice, PracticeDto } from '@/api/practices';

async function handleCreate(enrollmentId: string, type: 'LITURGICAL' | 'PEDAGOGICAL') {
  try {
    const result: PracticeDto = await createPractice({ enrollmentId, practiceType: type });
    // Редирект на страницу созданного журнала
    navigate(`/practices/${result.id}`);
  } catch (error) {
    if (error.status === 409) {
      // Показать уведомление: "Журнал такого типа уже существует"
      showNotification('error', 'Журнал такого типа уже создан для этого студента');
    } else if (error.status === 400) {
      // Показать уведомление: "Неверный тип практики"
      showNotification('error', error.message);
    }
  }
}
```

---

## 📝 Последовательность типичного сценария

1. **Получить enrollment студента** (через API студентов/зачислений)
2. **Проверить, какие журналы практик существуют** — `GET /practices?enrollmentId=UUID`
3. **Создать недостающий журнал практики** — `POST /practices`
4. **Заполнить записи** — `POST /practices/:id/entries`
5. **Студент меняет статус на `SUBMITTED`** — `PATCH /practices/:id`
6. **Администратор одобряет каждую запись** — `PATCH /practices/:practiceId/entries/:id/approve`
7. **Администратор утверждает весь журнал** — `PATCH /practices/:id`

---

## 🧪 Примеры типов для API-клиента (React/TS)

```typescript
// api/practices.ts

import { apiClient } from '@/lib/api-client';

export type PracticeType = 'LITURGICAL' | 'PEDAGOGICAL';
export type PracticeStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export interface CreatePracticePayload {
  enrollmentId: string;
  practiceType: PracticeType;
}

export interface UpdatePracticePayload {
  practiceStatus?: PracticeStatus;
}

export interface PracticeDto {
  id: string;
  enrollmentId: string;
  practiceType: PracticeType;
  practiceStatus: PracticeStatus;
  entries?: PracticeEntryDto[];
}

export interface PracticeEntryDto {
  id: string;
  practiceId: string;
  title: string;
  serviceKind: string | null;
  location: string | null;
  date: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface CreatePracticeEntryPayload {
  title: string;
  serviceKind?: string;
  location?: string;
  date: string;
}

export interface UpdatePracticeEntryPayload {
  title?: string;
  serviceKind?: string;
  location?: string;
  date?: string;
}

export interface ApprovePracticeEntryPayload {
  approvedBy?: string;
}

// Practices
export const createPractice = (data: CreatePracticePayload) =>
  apiClient.post<PracticeDto>('/practices', data);

export const getPractices = (enrollmentId: string) =>
  apiClient.get<PracticeDto[]>('/practices', { params: { enrollmentId } });

export const getPractice = (id: string) =>
  apiClient.get<PracticeDto>(`/practices/${id}`);

export const updatePractice = (id: string, data: UpdatePracticePayload) =>
  apiClient.patch<PracticeDto>(`/practices/${id}`, data);

export const deletePractice = (id: string) =>
  apiClient.delete(`/practices/${id}`);

// Practice Entries
export const createPracticeEntry = (practiceId: string, data: CreatePracticeEntryPayload) =>
  apiClient.post<PracticeEntryDto>(`/practices/${practiceId}/entries`, data);

export const getPracticeEntries = (practiceId: string) =>
  apiClient.get<PracticeEntryDto[]>(`/practices/${practiceId}/entries`);

export const updatePracticeEntry = (practiceId: string, entryId: string, data: UpdatePracticeEntryPayload) =>
  apiClient.patch<PracticeEntryDto>(`/practices/${practiceId}/entries/${entryId}`, data);

export const approvePracticeEntry = (practiceId: string, entryId: string, data?: ApprovePracticeEntryPayload) =>
  apiClient.patch<PracticeEntryDto>(`/practices/${practiceId}/entries/${entryId}/approve`, data ?? {});

export const deletePracticeEntry = (practiceId: string, entryId: string) =>
  apiClient.delete(`/practices/${practiceId}/entries/${entryId}`);
```
