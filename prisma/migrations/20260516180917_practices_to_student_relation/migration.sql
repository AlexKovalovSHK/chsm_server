/*
  Warnings:

  - You are about to drop the column `teacher_name` on the `subjects` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gradebook_number]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gradebook_number` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameRu` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scale` to the `subjects` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PracticeType" AS ENUM ('LITURGICAL', 'PEDAGOGICAL');

-- CreateEnum
CREATE TYPE "PracticeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "teacher_name" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "gradebook_issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gradebook_number" TEXT NOT NULL,
ADD COLUMN     "nameRu" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "teacher_name",
ADD COLUMN     "is_core" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scale" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "practices" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "practice_type" TEXT NOT NULL,
    "practice_status" TEXT NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_entries" (
    "id" UUID NOT NULL,
    "practice_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "service_kind" TEXT,
    "location" TEXT,
    "date" DATE NOT NULL,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,

    CONSTRAINT "practice_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "practices_student_id_practice_type_key" ON "practices"("student_id", "practice_type");

-- CreateIndex
CREATE UNIQUE INDEX "students_gradebook_number_key" ON "students"("gradebook_number");

-- AddForeignKey
ALTER TABLE "practices" ADD CONSTRAINT "practices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_entries" ADD CONSTRAINT "practice_entries_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
