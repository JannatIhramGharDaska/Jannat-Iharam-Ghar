
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

type OrderItemInput = {
  productId: string;
  quantity: number;
  variant?: string;
};

type PreparedItem = {
  productId: string;
  quantity: number;
  price: number;
  variant: string | null;
};

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  try {
    const b = await req.json();

    const customerName = String(b.customerName || '').trim();
    const customerPhone = String(b.customerPhone || '').trim();
    const deliveryAddress = String(b.deliveryAddress || '').trim();
    const city = String(b.city || '').trim();

    if (
      !customerName ||
      !customerPhone ||
      !deliveryAddress ||
      !city ||
      !Array.isArray(b.items) ||
      !b.items.length
    ) {
      return NextResponse.json(
        { success: false, error: 'Complete required fields and add products.' },
        { status: 400 }
      );
    }

    const inputItems: OrderItemInput[] = b.items;
    const ids = inputItems.map((i) => String(i.productId || ''));

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
    });

    if (products.length !== new Set(ids).size) {
      return NextResponse.json(
        { success: false, error: 'A product is unavailable. Refresh your cart.' },
        { status: 400 }
      );
    }

    const items: PreparedItem[] = inputItems.map((i) => {
      const p = products.find((x) => x.id === String(i.productId));
      const q = Number(i.quantity);

      if (!p || !Number.isInteger(q) || q < 1 || q > 100 || p.stock < q) {
        throw new Error('Insufficient stock for ' + (p?.name || 'product'));
      }

      return {
        productId: p.id,
        quantity: q,
        price: Number(p.salePrice ?? p.price),
        variant: i.variant ? String(i.variant) : null,
      };
    });

    const subtotal = items.reduce(
      (sum: number, item: PreparedItem) => sum + item.price * item.quantity,
      0
    );

    const deliveryFee = 200;
    const orderNumber = 'JIG-' + Date.now().toString().slice(-8);

    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerPhone,
          deliveryAddress,
          city,
          orderNotes: b.orderNotes ? String(b.orderNotes) : null,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          items: { create: items },
        },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json(
      {
        success: true,
        orderNumber: order.orderNumber,
        total: order.total,
        items: order.items.map((i) => ({
          name: i.product.name,
          variant: i.variant || undefined,
          quantity: i.quantity,
          price: i.price,
        })),
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Could not place order.',
      },
      { status: 400 }
    );
  }
}
