/*
  Warnings:

  - The primary key for the `_LeadFollowers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_LeadFollowers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_LeadFollowers" DROP CONSTRAINT "_LeadFollowers_AB_pkey";

-- AlterTable
ALTER TABLE "organization_profile" ADD COLUMN     "logo_url" TEXT;

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_deal_updates" BOOLEAN NOT NULL DEFAULT true,
    "email_activity_reminders" BOOLEAN NOT NULL DEFAULT true,
    "email_marketing" BOOLEAN NOT NULL DEFAULT false,
    "push_deal_updates" BOOLEAN NOT NULL DEFAULT true,
    "push_reminders" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "_LeadFollowers_AB_unique" ON "_LeadFollowers"("A", "B");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
