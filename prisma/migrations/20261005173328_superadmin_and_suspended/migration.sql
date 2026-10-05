-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;
