-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "mongo_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "username" TEXT,
    "tel" TEXT,
    "photo_url" TEXT,
    "email" TEXT,
    "tg_id" TEXT,
    "google_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "status" TEXT NOT NULL DEFAULT 'active',
    "google_tokens" JSONB,
    "language_code" TEXT,
    "registration_step" TEXT NOT NULL DEFAULT 'new',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "platform_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "source_user" TEXT,
    "source_tg" TEXT,
    "merged_at" TIMESTAMP(3),
    "password" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_auths" (
    "id" SERIAL NOT NULL,
    "mongo_id" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expiry_date" BIGINT,
    "scope" TEXT,
    "token_type" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "google_auths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_levels" (
    "id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "session_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_mongo_id_key" ON "users"("mongo_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_auths_mongo_id_key" ON "google_auths"("mongo_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_auths_email_key" ON "google_auths"("email");
