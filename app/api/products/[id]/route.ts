
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const admin = await isAdmin();

    const p = await prisma.product.findFirst({
      where: {
        id,
        ...(admin ? {} : { isArchived: false }),
      },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!p) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      product: { ...p, categoryName: p.category.name },
    });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { error: 'Could not load product.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const b = await req.json();

    const current = await prisma.product.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const stockMode = b.stockMode ?? current.stockMode;

    if (!['STANDARD', 'VARIANT', 'ML'].includes(stockMode)) {
      return NextResponse.json(
        { error: 'Invalid stock mode.' },
        { status: 400 }
      );
    }

    if (b.variants !== undefined && !Array.isArray(b.variants)) {
      return NextResponse.json(
        { error: 'Variants must be an array.' },
        { status: 400 }
      );
    }

    const variants = b.variants as any[] | undefined;

    if (variants) {
      if (stockMode !== 'STANDARD' && variants.length === 0) {
        return NextResponse.json(
          { error: 'At least one variant is required.' },
          { status: 400 }
        );
      }

      for (const variant of variants) {
        if (!String(variant.name || '').trim()) {
          return NextResponse.json(
            { error: 'Every variant must have a name.' },
            { status: 400 }
          );
        }

        if (
          stockMode === 'VARIANT' &&
          (!Number.isInteger(Number(variant.stock)) ||
            Number(variant.stock) < 0)
        ) {
          return NextResponse.json(
            { error: 'Variant stock must be a non-negative whole number.' },
            { status: 400 }
          );
        }

        if (
          stockMode === 'ML' &&
          (!Number.isFinite(Number(variant.sizeMl)) ||
            Number(variant.sizeMl) <= 0)
        ) {
          return NextResponse.json(
            { error: 'Every ittar variant needs a valid ml size.' },
            { status: 400 }
          );
        }
      }
    }

    const updateData: any = {
      ...(b.name !== undefined ? { name: String(b.name).trim() } : {}),
      ...(b.description !== undefined
        ? { description: String(b.description) }
        : {}),
      ...(b.sku !== undefined ? { sku: String(b.sku).trim() } : {}),
      ...(b.featured !== undefined ? { featured: Boolean(b.featured) } : {}),
      ...(b.images !== undefined
        ? {
            images:
              typeof b.images === 'string'
                ? b.images
                : JSON.stringify(b.images),
          }
        : {}),
      ...(b.categoryId !== undefined
        ? { categoryId: String(b.categoryId) }
        : {}),
      ...(b.price !== undefined ? { price: Number(b.price) } : {}),
      ...(b.stock !== undefined ? { stock: Number(b.stock) } : {}),
      ...(b.salePrice !== undefined
        ? { salePrice: b.salePrice === null ? null : Number(b.salePrice) }
        : {}),
      ...(b.stockMode !== undefined ? { stockMode } : {}),
    };

    const product = await prisma.$transaction(async (tx) => {
      if (variants !== undefined) {
        await tx.variant.deleteMany({
          where: { productId: id },
        });
      }

      const updated = await tx.product.update({
        where: { id },
        data: {
          ...updateData,
          ...(variants !== undefined
            ? {
                variants: {
                  create: variants.map((variant) => ({
                    name: String(variant.name).trim(),
                    price: null,
                    stock:
                      stockMode === 'VARIANT'
                        ? Math.max(0, Number(variant.stock || 0))
                        : 0,
                    sizeMl:
                      stockMode === 'ML' ? Number(variant.sizeMl) : null,
                    images: JSON.stringify(
                      Array.isArray(variant.images) ? variant.images : []
                    ),
                  })),
                },
              }
            : {}),
        },
        include: {
          variants: true,
          category: true,
        },
      });

      return updated;
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Could not update product.' },
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

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isArchived: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found.' },
        { status: 404 }
      );
    }

    const orderHistory = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderHistory > 0) {
      await prisma.product.update({
        where: { id },
        data: {
          isArchived: true,
          featured: false,
        },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: 'Product archived. Previous order history is preserved.',
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      archived: false,
      message: 'Product permanently deleted.',
    });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json(
      { error: 'Could not delete product.' },
      { status: 400 }
    );
  }
}
