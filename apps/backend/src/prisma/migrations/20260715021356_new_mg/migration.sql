/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");
