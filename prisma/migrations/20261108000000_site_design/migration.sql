CREATE TABLE "SiteDesign" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "draft" JSONB NOT NULL,
    "published" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteDesign_pkey" PRIMARY KEY ("id")
);
