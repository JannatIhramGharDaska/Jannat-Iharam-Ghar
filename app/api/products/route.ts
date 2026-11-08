
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get('featured');
    const admin = await isAdmin();

    const products = await prisma.product.findMany({
      where: {
        ...(admin ? {} : { isArchived: false }),
        ...(featured === 'true'
          ? {
              featured: true,
              OR: [
                { stock: { gt: 0 } },
                { variants: { some: { stock: { gt: 0 } } } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        categoryName: p.category.name,
      })),
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Could not load products.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const b = await req.json();

    if (
      !b.name ||
      !b.sku ||
      !Number.isFinite(Number(b.price)) ||
      !b.category
    ) {
      return NextResponse.json(
        { error: 'Name, SKU, price and category are required.' },
        { status: 400 }
      );
    }

    const stockMode = ['STANDARD', 'VARIANT', 'ML'].includes(b.stockMode)
      ? b.stockMode
      : 'STANDARD';

    const variants = Array.isArray(b.variants) ? b.variants : [];

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

      if (stockMode === 'VARIANT' && Number(variant.stock) < 0) {
        return NextResponse.json(
          { error: 'Variant stock cannot be negative.' },
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

    const categoryName = String(b.category).trim();
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: categoryName, slug },
    });

    const product = await prisma.product.create({
      data: {
        sku: String(b.sku).trim(),
        name: String(b.name).trim(),
        description: String(b.description || ''),
        price: Number(b.price),
        salePrice: b.salePrice ? Number(b.salePrice) : null,
        stock:
          stockMode === 'VARIANT'
            ? 0
            : Math.max(0, Number(b.stock || 0)),
        stockMode,
        images: JSON.stringify(
          Array.isArray(b.images)
            ? b.images
            : [b.image || '/images/placeholder.svg']
        ),
        categoryId: category.id,
        featured: Boolean(b.featured),
        variants: {
          create: variants.map((variant: any) => ({
            name: String(variant.name).trim(),
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
      },
      include: {
        variants: true,
        category: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Product creation error:', error);

    return NextResponse.json(
      { error: 'Could not create product. Check that SKU is unique.' },
      { status: 400 }
    );
  }
}
