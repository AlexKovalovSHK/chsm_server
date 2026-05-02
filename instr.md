# Как получить и сохранить Google Classroom admin token

## Что важно понимать

В проекте есть 2 вида токенов:

- JWT (`/auth/login`) — для доступа к API приложения.
- Google OAuth token — для работы с Google Classroom.

Ниже инструкция именно для **Google OAuth token** администратора школы.

## Предварительные условия

1. Приложение запущено (например, локально на `http://localhost:5001`).
2. В `.env` заполнены:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `ADMIN_SYSTEM_EMAIL` (почта админа, под которой будет OAuth-логин)
3. В Google Cloud у OAuth-клиента разрешен redirect URI, который совпадает с `GOOGLE_REDIRECT_URI`.

## Пошагово

1. Открой в браузере:

`GET /auth/login-email?email=<ADMIN_SYSTEM_EMAIL>`

Пример:

`http://localhost:5001/auth/login-email?email=admin@school.edu`

2. Авторизуйся в Google **под тем же email**, что указан в `ADMIN_SYSTEM_EMAIL`.

3. После успешного OAuth Google вернет тебя на callback, а backend автоматически:
   - получит `tokens` из `code`,
   - проверит email профиля,
   - если email совпадает с `ADMIN_SYSTEM_EMAIL`, сохранит токены как системные.

## Куда сохраняется токен

В MongoDB, коллекция:

`system_google_auth`

Поля документа:

- `email`
- `tokens` (`access_token`, `refresh_token`, `expiry_date`, и др.)
- `isActive: true`

## Как проверить, что все прошло успешно

1. В ответе после callback должно быть сообщение об успешной настройке.
2. В базе должен появиться/обновиться документ в `system_google_auth` с нужным email.
3. Эндпоинты, которые используют системный токен (например `auth/admin/live-report`), должны перестать падать с ошибкой "Системный Google токен не найден".

## Частые проблемы

- Email в Google-аккаунте не совпадает с `ADMIN_SYSTEM_EMAIL`.
- Неверный `GOOGLE_REDIRECT_URI` или не добавлен в Google Cloud.
- Не выдан `refresh_token` (иногда помогает повторный consent).
- Приложение запущено с другим `.env`.
