-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReviewInvite" ADD COLUMN     "generationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastGeneratedAt" TIMESTAMP(3);
