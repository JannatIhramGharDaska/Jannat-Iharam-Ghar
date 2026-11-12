
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Coupons GET error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load coupons.',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const b = await req.json();

    const code = String(b.code || '').trim().toUpperCase();
    const type = String(b.type || 'PERCENT');
    const value = Number(b.value);
    const minSubtotal = Number(b.minSubtotal || 0);

    const maxUses =
      b.maxUses === '' || b.maxUses == null
        ? null
        : Number(b.maxUses);

    const expiresAt = b.expiresAt
      ? new Date(b.expiresAt + 'T23:59:59')
      : null;

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      throw new Error('Code must be 3-30 letters/numbers.');
    }

    if (!['PERCENT', 'FIXED'].includes(type)) {
      throw new Error('Invalid discount type.');
    }

    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      (type === 'PERCENT' && value > 100)
    ) {
      throw new Error('Invalid discount value.');
    }

    if (!Number.isFinite(minSubtotal) || minSubtotal < 0) {
      throw new Error('Invalid minimum subtotal.');
    }

    if (
      maxUses !== null &&
      (!Number.isInteger(maxUses) || maxUses < 1)
    ) {
      throw new Error('Invalid usage limit.');
    }

    if (
      expiresAt &&
      (!Number.isFinite(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now())
    ) {
      throw new Error('Expiry must be in the future.');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        minSubtotal,
        maxUses,
        expiresAt,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupons POST error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not create coupon.',
      },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const b = await req.json();

    const coupon = await prisma.coupon.update({
      where: { id: String(b.id) },
      data: { active: Boolean(b.active) },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupons PATCH error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not update coupon.',
      },
      { status: 400 }
    );
  }
}