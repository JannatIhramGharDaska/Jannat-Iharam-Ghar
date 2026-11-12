
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
import { validateCoupon } from '@/lib/coupon';

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

function isValidCloudinaryUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      url.pathname.startsWith(`/${cloudName}/image/upload/`)
    );
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true,
          reviewInvite: {
            select: {
              generationCount: true,
              lastGeneratedAt: true,
            },
          },
          review: true,
        },
      },
    },
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

    const paymentMethod = String(
      b.paymentMethod || 'Cash on Delivery (COD)'
    ).trim();

    const isCOD = paymentMethod === 'Cash on Delivery (COD)';

    if (
      !customerName ||
      !customerPhone ||
      !deliveryAddress ||
      !city ||
      !Array.isArray(b.items) ||
      !b.items.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Complete required fields and add products.',
        },
        { status: 400 }
      );
    }

    let paymentScreenshot: string | null = null;

    if (!isCOD) {
      if (!isValidCloudinaryUrl(b.paymentScreenshot)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Please upload a valid payment screenshot.',
          },
          { status: 400 }
        );
      }

      paymentScreenshot = b.paymentScreenshot;
    }

    const inputItems: OrderItemInput[] = b.items;

    const ids: string[] = Array.from(
      new Set(inputItems.map((i) => String(i.productId || '')))
    );

    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        isArchived: false,
      },
      include: {
        variants: true,
      },
    });

    if (products.length !== ids.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'A product is unavailable. Refresh your cart.',
        },
        { status: 400 }
      );
    }

    const items: PreparedItem[] = inputItems.map((i) => {
      const p = products.find(
        (x) => x.id === String(i.productId)
      );

      const q = Number(i.quantity);

      if (
        !p ||
        !Number.isInteger(q) ||
        q < 1 ||
        q > 100
      ) {
        throw new Error('Invalid product or quantity.');
      }

      const variantName = i.variant
        ? String(i.variant).trim()
        : null;

      let itemPrice = Number(p.salePrice ?? p.price);

      if (p.variants.length > 0) {
        if (!variantName) {
          throw new Error(
            'Please select a variant for ' + p.name
          );
        }

        const selectedVariant = p.variants.find(
          (v) => v.name === variantName
        );

        if (!selectedVariant) {
          throw new Error(
            'Selected variant is unavailable for ' + p.name
          );
        }

        itemPrice = Number(
          selectedVariant.price ?? p.price
        );
      } else if (variantName) {
        throw new Error(
          'Selected variant is unavailable for ' + p.name
        );
      }

      if (p.stock < q) {
        throw new Error(
          'Insufficient stock for ' + p.name
        );
      }

      return {
        productId: p.id,
        quantity: q,
        price: itemPrice,
        variant: variantName,
      };
    });

    const quantitiesByProduct = new Map<string, number>();

    for (const item of items) {
      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) +
          item.quantity
      );
    }

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = products.find(
        (p) => p.id === productId
      );

      if (!product || product.stock < quantity) {
        throw new Error(
          'Insufficient stock for ' +
            (product?.name || 'product')
        );
      }
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const deliveryFee = 200;
    const codCharges = isCOD ? 70 : 0;
    const couponCode = String(b.couponCode || '').trim().toUpperCase();
    const couponResult = couponCode ? await validateCoupon(couponCode, subtotal) : null;
    const discount = couponResult?.discount ?? 0;
    const total = subtotal - discount + deliveryFee + codCharges;

    const paymentStatus = isCOD
      ? 'Not Required'
      : 'Pending';

    const orderNumber =
      'JIG-' + Date.now().toString().slice(-8);

    const order = await prisma.$transaction(async (tx) => {
      if (couponResult) {
        const updated = await tx.coupon.updateMany({
          where: {
            id: couponResult.coupon.id,
            active: true,
            ...(couponResult.coupon.maxUses !== null ? { usedCount: { lt: couponResult.coupon.maxUses } } : {}),
            ...(couponResult.coupon.expiresAt ? { expiresAt: { gt: new Date() } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (updated.count !== 1) throw new Error('Coupon is no longer available.');
      }
      for (const [productId, quantity] of quantitiesByProduct) {
        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            isArchived: false,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });

        if (updated.count !== 1) {
          throw new Error(
            'Insufficient stock. Please refresh your cart.'
          );
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          isNew: true,
          customerName,
          customerPhone,
          deliveryAddress,
          city,
          orderNotes: b.orderNotes
            ? String(b.orderNotes)
            : null,
          paymentMethod,
          paymentScreenshot,
          paymentStatus,
          subtotal,
          deliveryFee,
          discount,
          couponCode: couponResult?.coupon.code ?? null,
          couponId: couponResult?.coupon.id ?? null,
          total,
          items: {
            create: items,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        orderNumber: order.orderNumber,
        total: order.total,
        discount: order.discount,
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
        error:
          e instanceof Error
            ? e.message
            : 'Could not place order.',
      },
      { status: 400 }
    );
  }
}
