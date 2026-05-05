-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "session_runs" (
    "id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "classroom_course_id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "session_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "session_runs" ADD CONSTRAINT "session_runs_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "session_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_runs" ADD CONSTRAINT "session_runs_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
