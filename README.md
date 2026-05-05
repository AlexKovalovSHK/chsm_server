# CHSM Classroom Integrations

CHSM Classroom Integrations is a backend API service built with **NestJS**. It acts as a central hub connecting Google Classroom, Telegram, and a custom web/extension front-end into a unified user management and notification system.

## 📌 System Overview

The primary goal of this system is to manage students and teachers across multiple platforms, synchronizing data between Google Classroom and Telegram. It allows administrators to track students, sync course states, and send bulk announcements or personal messages via a Telegram Bot.

### Key Features
1. **User Management (DDD Pattern)**:
   - Full CRUD for users with roles (`student`, `admin`, etc.).
   - Stores Telegram ID (`tgId`) and Google ID (`googleId`) to unify user identity.
2. **Google Classroom Integration**:
   - OAuth2 authorization flow.
   - Syncs active courses, students, and teachers.
   - Fetches coursework and grades.
   - Allows sending global announcements to all Classroom courses.
   - Sends emails via Gmail API.
3. **Telegram Bot Integration**:
   - Built on `grammy` to act as an internal API for a Telegram bot.
   - Exposes endpoints to sync Telegram users, update registration steps, and handle user blocking.
   - Allows broadcasting messages to specific Telegram users by `tgId` or `email` (used by Chrome Extension).
4. **Authentication & Security**:
   - JWT-based authentication using Passport.
   - Basic Auth protection for Swagger documentation.
   - CORS configured for multiple administrative frontends and browser extensions.

---

## 🏗 Architecture

The project is structured according to **Domain-Driven Design (DDD)** principles and modular NestJS architecture:

```text
src/
├── prisma/                 # PrismaService and global DB client
├── app.module.ts           # Root module connecting Postgres, Scheduler, and all domains
├── auth/                   # Authentication domain (JWT, Guards, Strategies)
├── classroom/              # Google Classroom integration logic
│   └── service/            # Business logic for Google APIs (courses, Gmail, students)
├── telegram/               # Telegram bot and messaging logic
│   ├── controller/         # Webhooks & internal REST API (e.g. broadcasting)
│   └── service/            # Bot API interaction and user sync logic
└── users/                  # Core user domain
    ├── application/        # Application services and DTOs (UserService, Mappers)
    ├── controllers/        # REST API for users
    └── infrastructure/     # Database logic (Prisma User Repository)
```

### Technology Stack
- **Framework**: NestJS (TypeScript)
- **Runtime Engine**: Bun
- **Database**: PostgreSQL (Prisma 5.x)
- **APIs**: Google APIs (Classroom, Gmail, OAuth2), Telegram Bot API (`grammy`)
- **Containerization**: Docker & Docker Compose (`chsm_serv` running on port 5008)

---

## ⚙️ Principle of Operation

1. **Authentication Flow**:
   - Users/Admins can authenticate via standard login (yielding a JWT) or through Google OAuth.
   - When authenticating via Google, the system retrieves tokens and Google Profile, linking it to an existing email or Telegram ID.

2. **Data Synchronization**:
   - **Telegram**: The Telegram bot calls `POST /internal/users/upsert` or `PATCH /internal/users/sync` to create or update users in the PostgreSQL database via `UserService`.
   - **Classroom**: Administrators can fetch the latest roster of students, teachers, and active courses directly via Google API integrations. All persistence flows through `UserService`.

3. **Broadcasting Engine**:
   - The system exposes endpoints like `POST /internal/users/broadcast-extension`.
   - The Chrome extension or Admin Web Panel sends a list of emails and a text message.
   - The system looks up the corresponding `tgId` for each email and dispatches the message via the Telegram Bot API (`BotApiService`).

---

## 🚀 Getting Started for Agents/Developers

### Prerequisites
- Node.js (or Bun) installed.
- PostgreSQL database running.
- `.env` file with Google API credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`), Telegram Bot Token, JWT secret, and `DATABASE_URL`.

### Running the Project Locally

```bash
# Install dependencies
npm install (or bun install)

# Run in development mode using Bun
npm run start:dev
```

### Running with Docker

```bash
docker-compose up -d --build
```

### Important API Endpoints
- **Swagger Docs**: `/api/docs` (Protected by Basic Auth: `admin` / `Abc!1234`)
- **Google Auth**: `/classroom/auth`
- **User Broadcast**: `/internal/users/broadcast-extension` (Expects array of emails and text)
- **Telegram Webhook/Internal**: `/internal/users/...`

### Further Work Context
When working with agents on this repository:
- Any new database models should be placed in `infrastructure` or `schemas` folders respectively.
- Business logic should be kept in `application` or `service` layers.
- Be cautious with CORS changes in `main.ts` as the Chrome Extension and Admin panels rely on specific origins.
