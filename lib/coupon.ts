import { prisma } from '@/lib/prisma';

export async function validateCoupon(rawCode: unknown, subtotal: number) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) throw new Error('Please enter a coupon code.');
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) throw new Error('Invalid or inactive coupon.');
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) throw new Error('Coupon has expired.');
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new Error('Coupon usage limit reached.');
  if (subtotal < coupon.minSubtotal) throw new Error(`Minimum order amount is PKR ${coupon.minSubtotal}.`);
  const discount = coupon.type === 'PERCENT'
    ? Math.round(subtotal * coupon.value / 100 * 100) / 100
    : Math.min(subtotal, coupon.value);
  return { coupon, discount: Math.max(0, Math.min(subtotal, discount)) };
}
