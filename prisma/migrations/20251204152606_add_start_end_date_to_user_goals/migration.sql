/*
  Warnings:

  - You are about to drop the column `due_date` on the `user_goals` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `user_goals` table. All the data in the column will be lost.
  - You are about to drop the column `remind_time` on the `user_goals` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `user_goals` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `user_goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `user_goals` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `user_goals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('yearly', 'monthly', 'weekly');

-- AlterTable
ALTER TABLE "user_goals" DROP COLUMN "due_date",
DROP COLUMN "progress",
DROP COLUMN "remind_time",
DROP COLUMN "status",
ADD COLUMN     "end_date" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "start_date" TIMESTAMPTZ NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "GoalType" NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);
