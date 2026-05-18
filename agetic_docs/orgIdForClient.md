# Client Guide: Передача organizationId (x-org-id)

## Задача

Все серверные запросы, связанные с multi-tenancy, должны передавать заголовок `x-org-id` с UUID организации. 
Без этого заголовка система не сможет определить, в какой организации выполнять операцию.

## Как это работает

**Клиент (фронтенд)** → для каждого запроса к API проставляет `x-org-id` в заголовках HTTP.
**Сервер** → читает заголовок `x-org-id`, определяет организацию, выполняет операцию.

## Какие запросы требуют x-org-id

Все CRUD-операции в следующих модулях требуют `x-org-id`:

1. **Session Levels** — `PATCH /session-levels`, `POST /session-levels`, `GET /session-levels`, `DELETE /session-levels/:id`
2. **Session Runs** — `PATCH /session-runs`, `POST /session-runs`, `GET /session-runs`, `DELETE /session-runs/:id`
3. **Practices** — `PATCH /practices`, `POST /practices`, `GET /practices`, `DELETE /practices/:id`
4. **Students** — `PATCH /students`, `POST /students`, `GET /students`, `DELETE /students/:id`
5. **Users (смена роли)** — `PATCH /api/users/:id`, `PATCH /api/users/:id/role`
6. **Enrollments** — `POST /enrollments`, `GET /enrollments`, `DELETE /enrollments/:id`
7. **Grades** — `POST /grades`, `GET /grades`
8. **Academic Years** — `POST /academic-years`, `GET /academic-years`, `DELETE /academic-years/:id`
9. **Subjects** — `POST /subjects`, `GET /subjects`, `DELETE /subjects/:id`
10. **Gradebooks** — `POST /gradebooks`, `GET /gradebooks`, `DELETE /gradebooks/:id`
11. **Admin/Organizations** — `POST /admin/organizations`, `GET /admin/organizations`, и т.д.

## Где хранить orgId

`x-org-id` должен читаться из sessionStorage (или localStorage) и автоматически проставляться на каждый запрос.

## Как проставлять (axios interceptor)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  // JWT токен
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ID текущей организации
  const orgId = sessionStorage.getItem('currentOrgId');
  if (orgId) {
    config.headers['x-org-id'] = orgId;
  }

  return config;
});
```

## Когда сохранять orgId

1. **При логине** — если пользователь привязан к организации, её UUID сохраняется в sessionStorage.
2. **При выборе организации** — если пользователь может переключаться между организациями.
3. **При первом запросе** — если приложение определяет организацию по дефолту.

```typescript
// Сохранение при логине/выборе организации
sessionStorage.setItem('currentOrgId', 'UUID_ОРГАНИЗАЦИИ');
```

## Формат значения

`x-org-id` — это UUID организации (строковый идентификатор из таблицы `organizations`).

Пример:
```
x-org-id: 9550e896-0f07-411f-aca4-c23d5a418720
```

## Проверка работы

После внедрения interceptor'а проверить:
1. Открыть DevTools (F12) → Network
2. Найти любой запрос к API (например, `GET /students`)
3. В заголовках запроса должен присутствовать `x-org-id`
4. Сервер должен ответить `200 OK` (не `403 Forbidden` и не `500 Internal Server Error`)
