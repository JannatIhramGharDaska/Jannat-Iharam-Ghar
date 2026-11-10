
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REVIEW_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function validToken(token: string) {
  return /^[a-f0-9]{64}$/i.test(token);
}

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

async function findInvitation(token: string) {
  return prisma.reviewInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      orderItem: {
        include: {
          order: {
            select: {
              status: true,
              createdAt: true,
              customerName: true,
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
      },
    },
  });
}

function invitationError(
  invite: NonNullable<Awaited<ReturnType<typeof findInvitation>>>
) {
  const now = Date.now();
  const order = invite.orderItem.order;

  if (invite.usedAt || invite.orderItem.review) {
    return 'A review has already been submitted.';
  }

  if (
    now >= invite.expiresAt.getTime() ||
    now >= order.createdAt.getTime() + REVIEW_WINDOW_MS
  ) {
    return 'This review link has expired.';
  }

  if (order.status !== 'Delivered') {
    return 'Reviews are available only after delivery.';
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';

    if (!validToken(token)) {
      return NextResponse.json(
        { error: 'Invalid review link.' },
        { status: 400 }
      );
    }

    const invite = await findInvitation(token);

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid review link.' },
        { status: 404 }
      );
    }

    const error = invitationError(invite);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        productName: invite.orderItem.product.name,
        customerName: invite.orderItem.order.customerName,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Review verification error:', error);

    return NextResponse.json(
      { error: 'Could not verify review link.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) {
      return NextResponse.json(
        { error: 'Invalid request origin.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const token = String(body?.token || '');
    const rating = Number(body?.rating);
    const comment = String(body?.comment || '').trim();

    if (!validToken(token)) {
      return NextResponse.json(
        { error: 'Invalid review link.' },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: 'Please select a rating from 1 to 5.' },
        { status: 400 }
      );
    }

    if (comment.length < 10 || comment.length > 1000) {
      return NextResponse.json(
        { error: 'Review must contain 10 to 1000 characters.' },
        { status: 400 }
      );
    }

    const invite = await findInvitation(token);

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid review link.' },
        { status: 404 }
      );
    }

    const error = invitationError(invite);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();

      const updated = await tx.reviewInvite.updateMany({
        where: {
          id: invite.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (updated.count !== 1) {
        throw new Error('Review link is no longer available.');
      }

      const currentOrder = await tx.order.findUnique({
        where: { id: invite.orderItem.orderId },
        select: {
          status: true,
          createdAt: true,
        },
      });

      if (
        !currentOrder ||
        currentOrder.status !== 'Delivered' ||
        now.getTime() >=
          currentOrder.createdAt.getTime() + REVIEW_WINDOW_MS
      ) {
        throw new Error('Review is no longer available.');
      }

      await tx.review.create({
        data: {
          productId: invite.orderItem.productId,
          orderItemId: invite.orderItemId,
          rating,
          comment,
          status: 'Pending',
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Review submitted for admin approval.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review submission error:', error);

    return NextResponse.json(
      {
        error: 'Could not submit review. The link may already be used.',
      },
      { status: 400 }
    );
  }
}
