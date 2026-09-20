/*
  Warnings:

  - A unique constraint covering the columns `[problemNumber]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "problemNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Problem_problemNumber_key" ON "Problem"("problemNumber");
