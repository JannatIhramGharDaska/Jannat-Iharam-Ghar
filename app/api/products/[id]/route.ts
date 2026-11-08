
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  const p = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!p) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    product: { ...p, categoryName: p.category.name },
  });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const b = await req.json();

    const p = await prisma.product.update({
      where: { id },
      data: {
        ...(b.name !== undefined ? { name: String(b.name).trim() } : {}),
        ...(b.description !== undefined ? { description: String(b.description) } : {}),
        ...(b.sku !== undefined ? { sku: String(b.sku).trim() } : {}),
        ...(b.featured !== undefined ? { featured: Boolean(b.featured) } : {}),
        ...(b.images !== undefined ? { images: typeof b.images === 'string' ? b.images : JSON.stringify(b.images) } : {}),
        ...(b.categoryId !== undefined ? { categoryId: String(b.categoryId) } : {}),
        ...(b.price !== undefined ? { price: Number(b.price) } : {}),
        ...(b.stock !== undefined ? { stock: Number(b.stock) } : {}),
        ...(b.salePrice !== undefined
          ? { salePrice: b.salePrice === null ? null : Number(b.salePrice) }
          : {}),
      },
    });

    return NextResponse.json({ product: p });
  } catch {
    return NextResponse.json(
      { error: 'Could not update product' },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Product may already be part of an order.' },
      { status: 400 }
    );
  }
}
