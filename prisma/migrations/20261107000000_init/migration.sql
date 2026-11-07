-- Initial PostgreSQL schema for Jannat Ihram Ghar.
CREATE TABLE "Admin" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "imageUrl" TEXT,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "salePrice" DOUBLE PRECISION,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "images" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Variant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "productId" TEXT NOT NULL,
  CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "deliveryAddress" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "orderNotes" TEXT,
  "paymentMethod" TEXT NOT NULL DEFAULT 'Cash on Delivery (COD)',
  "subtotal" DOUBLE PRECISION NOT NULL,
  "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 200,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variant" TEXT,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "slot" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "MediaAsset_slot_key" ON "MediaAsset"("slot");
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
