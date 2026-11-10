import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
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

    if (!sameOrigin(req)) {
      return NextResponse.json(
        { error: 'Invalid request origin.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const orderItemId = String(body?.orderItemId || '').trim();

    if (!orderItemId) {
      return NextResponse.json(
        { error: 'Order item is required.' },
        { status: 400 }
      );
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          select: {
            status: true,
            createdAt: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        review: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found.' },
        { status: 404 }
      );
    }

    if (orderItem.order.status !== 'Delivered') {
      return NextResponse.json(
        {
          error: 'Review link can only be generated for delivered orders.',
        },
        { status: 400 }
      );
    }

    if (orderItem.review) {
      return NextResponse.json(
        {
          error: 'A review has already been submitted for this order item.',
        },
        { status: 400 }
      );
    }

    // Review window: 15 days from the original order placement date.
    // Regenerating a link never extends this deadline.
    const expiresAt = new Date(
      orderItem.order.createdAt.getTime() + 15 * 24 * 60 * 60 * 1000
    );

    if (expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          error: 'Review period expired. Reviews are allowed within 15 days of placing the order.',
        },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    await prisma.reviewInvite.upsert({
      where: { orderItemId },
      update: {
        tokenHash,
        expiresAt,
        usedAt: null,
      },
      create: {
        orderItemId,
        tokenHash,
        expiresAt,
      },
    });

    const reviewUrl = new URL('/review/' + token, req.url).toString();

    return NextResponse.json({
      success: true,
      reviewUrl,
      productName: orderItem.product.name,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Review invitation error:', error);

    return NextResponse.json(
      { error: 'Could not generate review link.' },
      { status: 500 }
    );
  }
}
