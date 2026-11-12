import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCoupon } from '@/lib/coupon';

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!Array.isArray(b.items) || !b.items.length) throw new Error('Your cart is empty.');
    const ids = Array.from(new Set<string>(b.items.map((i: any) => String(i.productId))));
    const products = await prisma.product.findMany({ where: { id: { in: ids }, isArchived: false }, include: { variants: true } });
    if (products.length !== ids.length) throw new Error('A product is unavailable.');
    let subtotal = 0;
    for (const item of b.items) {
      const product = products.find(p => p.id === item.productId);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Invalid cart item.');
      let price = product.salePrice ?? product.price;
      if (product.variants.length) {
        const variant = product.variants.find(v => v.name === item.variant);
        if (!variant) throw new Error('Invalid product variant.');
        price = variant.price ?? product.price;
      } else if (item.variant) throw new Error('Invalid product variant.');
      subtotal += price * quantity;
    }
    const { coupon, discount } = await validateCoupon(b.code, subtotal);
    return NextResponse.json({ code: coupon.code, discount, subtotal });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid coupon.' }, { status: 400 });
  }
}
