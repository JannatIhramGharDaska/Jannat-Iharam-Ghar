BEGIN;

TRUNCATE TABLE
  "ReviewInvite",
  "Review",
  "OrderItem",
  "Order",
  "Variant",
  "Product",
  "Category",
  "Coupon"
RESTART IDENTITY CASCADE;

COMMIT;