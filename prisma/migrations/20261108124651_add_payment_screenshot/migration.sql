-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentScreenshot" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'Pending';
