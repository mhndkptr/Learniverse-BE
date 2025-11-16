/*
  Warnings:

  - A unique constraint covering the columns `[course_transaction_id]` on the table `course_enrollments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "course_enrollments" ADD COLUMN     "course_transaction_id" TEXT;

-- AlterTable
ALTER TABLE "course_transactions" ADD COLUMN     "amount" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_course_transaction_id_key" ON "course_enrollments"("course_transaction_id");

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_transaction_id_fkey" FOREIGN KEY ("course_transaction_id") REFERENCES "course_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
