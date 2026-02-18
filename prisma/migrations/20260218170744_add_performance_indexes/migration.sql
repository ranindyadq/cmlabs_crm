/*
  Warnings:

  - The values [INCOMING,OUTGOING] on the enum `CallDirection` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CallDirection_new" AS ENUM ('INBOUND', 'OUTBOUND');
ALTER TABLE "calls" ALTER COLUMN "direction" TYPE "CallDirection_new" USING ("direction"::text::"CallDirection_new");
ALTER TYPE "CallDirection" RENAME TO "CallDirection_old";
ALTER TYPE "CallDirection_new" RENAME TO "CallDirection";
DROP TYPE "CallDirection_old";
COMMIT;

-- DropIndex
DROP INDEX "leads_owner_id_idx";

-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SENT';

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta';

-- CreateIndex
CREATE INDEX "calls_lead_id_idx" ON "calls"("lead_id");

-- CreateIndex
CREATE INDEX "calls_call_time_idx" ON "calls"("call_time");

-- CreateIndex
CREATE INDEX "emails_lead_id_idx" ON "emails"("lead_id");

-- CreateIndex
CREATE INDEX "emails_sent_at_idx" ON "emails"("sent_at");

-- CreateIndex
CREATE INDEX "invoices_lead_id_idx" ON "invoices"("lead_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "leads_closed_at_idx" ON "leads"("closed_at");

-- CreateIndex
CREATE INDEX "leads_deleted_at_owner_id_idx" ON "leads"("deleted_at", "owner_id");

-- CreateIndex
CREATE INDEX "leads_deleted_at_status_idx" ON "leads"("deleted_at", "status");

-- CreateIndex
CREATE INDEX "leads_deleted_at_owner_id_status_idx" ON "leads"("deleted_at", "owner_id", "status");

-- CreateIndex
CREATE INDEX "meetings_lead_id_idx" ON "meetings"("lead_id");

-- CreateIndex
CREATE INDEX "meetings_start_time_idx" ON "meetings"("start_time");

-- CreateIndex
CREATE INDEX "notes_lead_id_idx" ON "notes"("lead_id");

-- CreateIndex
CREATE INDEX "notes_created_at_idx" ON "notes"("created_at");
