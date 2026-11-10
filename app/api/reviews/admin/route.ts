import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
        orderItem: {
          include: {
            order: {
              select: { orderNumber: true, customerName: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { reviews },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Reviews admin GET error:', error);
    return NextResponse.json(
      { error: 'Could not load reviews.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sameOrigin(req)) {
      return NextResponse.json(
        { error: 'Invalid request origin.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const reviewId = typeof body?.reviewId === 'string'
      ? body.reviewId.trim()
      : '';
    const status = body?.status;

    if (!reviewId || !['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid review ID and status are required.' },
        { status: 400 }
      );
    }

    const result = await prisma.review.updateMany({
      where: { id: reviewId },
      data: { status },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Review not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Reviews admin PATCH error:', error);
    return NextResponse.json(
      { error: 'Could not update review status.' },
      { status: 500 }
    );
  }
}
