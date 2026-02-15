/*
  Warnings:

  - You are about to alter the column `value` on the `leads` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,4)`.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('NEW', 'REPEAT');

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_user_id_fkey";

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "clientType" "ClientType" DEFAULT 'NEW',
ADD COLUMN     "priority" "Priority" DEFAULT 'HIGH',
ALTER COLUMN "value" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "organization_profiles" ADD COLUMN     "tagline" TEXT;

-- DropTable
DROP TABLE "Notification";

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "type" TEXT DEFAULT 'INFO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "lead_id" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_actor_idx" ON "audit_logs"("user_id_actor");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;
