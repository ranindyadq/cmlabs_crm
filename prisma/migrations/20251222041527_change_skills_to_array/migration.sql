/*
  Warnings:

  - The `skills` column on the `user_work_info` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `organization_profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "user_work_info" DROP COLUMN "skills",
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "organization_profile";

-- CreateTable
CREATE TABLE "organization_profiles" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_profiles_pkey" PRIMARY KEY ("id")
);
