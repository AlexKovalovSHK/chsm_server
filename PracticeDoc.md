# Практики (Practice) — Документация для фронтенда

## 📋 Обзор

Система практик позволяет студенту вести **два журнала практик**:

| Тип | Назначение |
|---|---|
| **LITURGICAL** | Учёт богослужебной практики: службы, в которых студент принимал участие |
| **PEDAGOGICAL** | Учёт педагогической практики: уроки, занятия, которые студент провёл |

**Архитектурное решение:** практики привязаны напрямую к **Student** (не к Enrollment).  
У каждого студента — ровно **один LITURGICAL** и **один PEDAGOGICAL** журнал на весь период обучения.

Связь с Enrollment'ами не нужна — практики являются сквозными для всех курсов студента.

## 🧱 Модели данных (DTO)

### PracticeDto — журнал практики

```typescript
interface PracticeDto {
  id: string;              // UUID журнала
  studentId: string;       // UUID студента (из таблицы students)
  practiceType: string;    // 'LITURGICAL' | 'PEDAGOGICAL'
  practiceStatus: string;  // 'DRAFT' | 'SUBMITTED' | 'APPROVED'
  entries?: PracticeEntryDto[];  // записи (только при GET /:id)
}
```

### PracticeEntryDto — запись в журнале

```typescript
interface PracticeEntryDto {
  id: string;              // UUID записи
  practiceId: string;      // UUID журнала
  title: string;           // название/описание
  serviceKind: string | null;  // только для LITURGICAL (тип службы)
  location: string | null;     // только для PEDAGOGICAL (место)
  date: string;            // дата в формате "YYYY-MM-DD"
  approvedAt: string | null;   // дата утверждения ISO, null если не утверждена
  approvedBy: string | null;   // ID утвердившего (admin/teacher)
}
```

## 🔌 API Endpoints

**Базовый URL:** `http://localhost:5008/api` (или `http://localhost:5008`)

**Авторизация:** Bearer JWT токен в заголовке `Authorization`.

---

### 1. Журналы практик (Practices)

#### `POST /practices` — Создать журнал практики

Создаёт новый журнал для студента.

**Тело запроса:**

```typescript
{
  studentId: string;   // UUID студента
  practiceType: 'LITURGICAL' | 'PEDAGOGICAL';
}
```

**Ограничения:**
- У одного студента не может быть **двух** журналов одного типа (409 Conflict).
- Студент может создать журнал только для себя (403, если `studentId` ≠ свой).

**Успешный ответ (201):** `PracticeDto`

**Ошибки:**
- `409 Conflict` — журнал этого типа уже существует для данного студента.
- `403 Forbidden` — попытка создать журнал для другого студента.

---

#### `GET /practices` — Получить все свои журналы

Возвращает журналы практик.

- Для **студента** — только свои (фильтр по `student_id` из JWT).
- Для **admin/teacher** — все журналы всех студентов.

**Успешный ответ (200):** `PracticeDto[]` (без `entries` — только заголовки журналов).

**Типичный результат для студента:** массив из 0, 1 или 2 элементов (LITURGICAL и/или PEDAGOGICAL).

---

#### `GET /practices/:id` — Получить журнал с записями

Возвращает журнал практики **со всеми записями** (`entries` поле заполнено).

- Студент может смотреть **любой** журнал (ограничение по ролям снято).
- Admin/teacher — любые журналы.

**Успешный ответ (200):** `PracticeDto` с `entries: PracticeEntryDto[]`

---

#### `PATCH /practices/:id` — Обновить статус журнала

```typescript
{
  practiceStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}
```

- Студент может менять статус только своего журнала.
- Admin/teacher — любого.

**Успешный ответ (200):** `PracticeDto`

---

#### `DELETE /practices/:id` — Удалить журнал

Удаляет журнал и **все его записи** (CASCADE).

- Студент может удалить только свой журнал.
- Admin/teacher — любой.

**Успешный ответ (200):** без тела.

---

### 2. Записи в журнале (Practice Entries)

#### `POST /practices/:practiceId/entries` — Добавить запись

```typescript
{
  title: string;            // название/описание
  serviceKind?: string;     // обязательно для LITURGICAL
  location?: string;        // обязательно для PEDAGOGICAL
  date: string;             // "YYYY-MM-DD" или ISO
}
```

**Валидация:**
- Для `LITURGICAL` — `serviceKind` обязателен, `location` игнорируется.
- Для `PEDAGOGICAL` — `location` обязателен, `serviceKind` игнорируется.

**Успешный ответ (201):** `PracticeEntryDto`

---

#### `GET /practices/:practiceId/entries` — Получить все записи журнала

**Успешный ответ (200):** `PracticeEntryDto[]`

---

#### `PATCH /practices/:practiceId/entries/:entryId` — Обновить запись

Частичное обновление (все поля опциональны).

```typescript
{
  title?: string;
  serviceKind?: string;
  location?: string;
  date?: string;   // "YYYY-MM-DD"
}
```

**Успешный ответ (200):** `PracticeEntryDto`

---

#### `PATCH /practices/:practiceId/entries/:entryId/approve` — Одобрить запись

Только для **admin/teacher**. Студент получит `403 Forbidden`.

```typescript
{
  approvedBy?: string;   // опционально (по умолчанию ID текущего пользователя)
}
```

**Успешный ответ (200):** `PracticeEntryDto` (с заполненными `approvedAt`, `approvedBy`)

**Ошибки:**
- `400 Bad Request` — запись уже утверждена.
- `403 Forbidden` — попытка студента утвердить запись.

---

#### `DELETE /practices/:practiceId/entries/:entryId` — Удалить запись

- Студент может удалить запись только из своего журнала.
- Admin/teacher — любую.

**Успешный ответ (200):** без тела.

---

## 🚦 Статусы журнала практики

| Статус | Описание | Кто может установить |
|---|---|---|
| `DRAFT` | Черновик — студент добавляет записи | Любой владелец |
| `SUBMITTED` | Отправлено на проверку | Студент (владелец) |
| `APPROVED` | Утверждено | Admin / Teacher |

**Логика статусов:** `DRAFT → SUBMITTED → APPROVED`.  
Журнал со статусом `APPROVED` недоступен для редактирования (frontend должен это учитывать).

---

## 🎯 UI/UX Рекомендации

### Экран списка практик (2 журнала)

У студента максимум 2 журнала. Отображать в виде двух карточек:

```
┌─────────────────────────────────────┐
│  📖 Богослужебная практика           │
│                                      │
│  Статус: DRAFT                       │
│  Записей: 12                         │
│                                      │
│  [Открыть] [Редактировать]           │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  📚 Педагогическая практика          │
│                                      │
│  Статус: SUBMITTED                   │
│  Записей: 5                          │
│                                      │
│  [Открыть] [Редактировать]           │
└─────────────────────────────────────┘
```

- Если журнал ещё не создан — показывать карточку с кнопкой **«Создать»**.
- При создании — `POST /practices` с `practiceType` (studentId берётся из данных студента).

### Экран журнала со списком записей

Таблица записей с колонками:

| Заголовок | Дата | Тип (для литург.) / Место (для педаг.) | Статус утверждения |
|---|---|---|---|
| Всенощное бдение | 2024-10-25 | Всенощная | ✅ Утверждено |
| Урок сольфеджио | 2024-10-28 | Школа №5 | ⏳ Ожидает |

**Поведение:**
- **Кнопка «Добавить запись»** — открывает модалку/форму.
- Для `LITURGICAL` — показывать поле `serviceKind`, скрывать `location`.
- Для `PEDAGOGICAL` — показывать поле `location`, скрывать `serviceKind`.
- **Кнопка «Отправить на проверку»** — вызывает `PATCH /practices/:id` со статусом `SUBMITTED`.
- Если статус журнала `APPROVED` — редактирование записей заблокировано.
- **Утверждение записи** (admin/teacher) — кнопка «✅ Утвердить» на каждой записи.

---

## 🧪 Примеры типов для API-клиента (React/TS)

```typescript
// ---------- Enums ----------
type PracticeType = 'LITURGICAL' | 'PEDAGOGICAL';
type PracticeStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

// ---------- Payloads ----------
interface CreatePracticePayload {
  studentId: string;
  practiceType: PracticeType;
}

interface UpdatePracticePayload {
  practiceStatus: PracticeStatus;
}

interface PracticeDto {
  id: string;
  studentId: string;
  practiceType: PracticeType;
  practiceStatus: PracticeStatus;
  entries?: PracticeEntryDto[];
}

interface PracticeEntryDto {
  id: string;
  practiceId: string;
  title: string;
  serviceKind: string | null;
  location: string | null;
  date: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

interface CreatePracticeEntryPayload {
  title: string;
  serviceKind?: string;   // required for LITURGICAL
  location?: string;      // required for PEDAGOGICAL
  date: string;           // "YYYY-MM-DD"
}

interface UpdatePracticeEntryPayload {
  title?: string;
  serviceKind?: string;
  location?: string;
  date?: string;
}

interface ApprovePracticeEntryPayload {
  approvedBy?: string;
}
```

## ⚛️ React Query хуки (примеры)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API = 'http://localhost:5008';

// ---------- Practices ----------

// GET /practices
function usePractices() {
  return useQuery<PracticeDto[]>({
    queryKey: ['practices'],
    queryFn: () => fetch(`${API}/practices`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),
  });
}

// GET /practices/:id
function usePractice(id: string) {
  return useQuery<PracticeDto>({
    queryKey: ['practice', id],
    queryFn: () => fetch(`${API}/practices/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),
    enabled: !!id,
  });
}

// POST /practices
function useCreatePractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePracticePayload) =>
      fetch(`${API}/practices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practices'] }),
  });
}

// PATCH /practices/:id
function useUpdatePractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdatePracticePayload) =>
      fetch(`${API}/practices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practices'] }),
  });
}

// DELETE /practices/:id
function useDeletePractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`${API}/practices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practices'] }),
  });
}

// ---------- Entries ----------

// POST /practices/:practiceId/entries
function useCreateEntry(practiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePracticeEntryPayload) =>
      fetch(`${API}/practices/${practiceId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice', practiceId] }),
  });
}

// GET /practices/:practiceId/entries
function useEntries(practiceId: string) {
  return useQuery<PracticeEntryDto[]>({
    queryKey: ['practice', practiceId, 'entries'],
    queryFn: () => fetch(`${API}/practices/${practiceId}/entries`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),
    enabled: !!practiceId,
  });
}

// PATCH /practices/:practiceId/entries/:entryId
function useUpdateEntry(practiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, ...payload }: { entryId: string } & UpdatePracticeEntryPayload) =>
      fetch(`${API}/practices/${practiceId}/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice', practiceId] }),
  });
}

// PATCH /practices/:practiceId/entries/:entryId/approve
function useApproveEntry(practiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, ...payload }: { entryId: string } & ApprovePracticeEntryPayload) =>
      fetch(`${API}/practices/${practiceId}/entries/${entryId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice', practiceId] }),
  });
}

// DELETE /practices/:practiceId/entries/:entryId
function useDeleteEntry(practiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      fetch(`${API}/practices/${practiceId}/entries/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice', practiceId] }),
  });
}
```

## ⚠️ Типичные ошибки и их обработка

```typescript
interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}
```

| Код | message | Причина | Действие на фронте |
|---|---|---|---|
| `409` | `Practice journal of type LITURGICAL already exists for this student` | Повторное создание журнала | Показать существующий, скрыть кнопку «Создать» |
| `404` | `Practice not found` | Неверный ID | Показать «404 — журнал не найден» |
| `403` | `You do not have access to this practice journal` | Чужая практика | Перенаправить на список своих практик |
| `400` | `serviceKind is required for LITURGICAL practice` | Пропущено поле | Подсветить поле красным |
| `400` | `location is required for PEDAGOGICAL practice` | Пропущено поле | Подсветить поле красным |
| `400` | `Already approved` | Повторное утверждение | Показать сообщение «Уже утверждено» |
| `403` | `Only admin or teacher can approve entries` | Студент пытается утвердить | Скрыть кнопку «Утвердить» для студента |

## 📝 Последовательность типичного сценария (Student flow)

1. **Авторизация** — получить JWT токен.
2. **Загрузить профиль студента** — `GET /students/v2/:userId` → получаем `student.id`.
3. **Загрузить практики** — `GET /practices`:
   - Если массив пуст — показать 2 карточки с кнопками «Создать».
   - Если есть 1 журнал — показать 1 созданный + 1 кнопку «Создать» для второго типа.
   - Если есть 2 — всё готово.
4. **Создать журнал** — `POST /practices` с `{ studentId, practiceType }`.
5. **Открыть журнал** — `GET /practices/:id` → получаем `entries`.
6. **Добавить запись** — `POST /practices/:practiceId/entries` с полями под тип практики.
7. **Отправить на проверку** — `PATCH /practices/:id` → `{ practiceStatus: 'SUBMITTED' }`.
8. **Admin/teacher утверждает записи** — `PATCH /practices/:practiceId/entries/:entryId/approve`.
9. **Admin/teacher утверждает журнал** — `PATCH /practices/:id` → `{ practiceStatus: 'APPROVED' }`.
