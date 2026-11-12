
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { isNew: false },
      include: {
        items: {
          include: {
            product: true,
            review: true,
            reviewInvite: {
              select: {
                generationCount: true,
                lastGeneratedAt: true,
                expiresAt: true,
                usedAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { order },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Order details error:', error);

    return NextResponse.json(
      { error: 'Could not load order details.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const {
      status,
      paymentStatus,
      trackingNumber,
      shippingProvider,
      adminNotes,
      isNew,
    } = body;

    const orderExists = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        paymentMethod: true,
      },
    });

    if (!orderExists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const data: {
      status?: string;
      paymentStatus?: string;
      trackingNumber?: string | null;
      shippingProvider?: string | null;
      adminNotes?: string | null;
      isNew?: boolean;
    } = {};

    if (status !== undefined) {
      const allowedStatuses = [
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
      ];

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid order status' },
          { status: 400 }
        );
      }

      data.status = status;
    }

    if (paymentStatus !== undefined) {
      const allowedPaymentStatuses = [
        'Pending',
        'Verified',
        'Rejected',
      ];

      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }

      if (
        orderExists.paymentMethod === 'Cash on Delivery (COD)'
      ) {
        return NextResponse.json(
          { error: 'COD orders do not require payment verification.' },
          { status: 400 }
        );
      }

      data.paymentStatus = paymentStatus;
    }

    if (
      trackingNumber !== undefined ||
      shippingProvider !== undefined
    ) {
      if (
        typeof trackingNumber !== 'string' ||
        !trackingNumber.trim() ||
        trackingNumber.length > 100 ||
        typeof shippingProvider !== 'string' ||
        !shippingProvider.trim() ||
        shippingProvider.length > 100
      ) {
        return NextResponse.json(
          {
            error: 'Valid tracking number and shipping provider are required.',
          },
          { status: 400 }
        );
      }

      data.trackingNumber = trackingNumber.trim();
      data.shippingProvider = shippingProvider.trim();
    }

    if (adminNotes !== undefined) {
      if (
        adminNotes !== null &&
        typeof adminNotes !== 'string'
      ) {
        return NextResponse.json(
          { error: 'Invalid admin notes.' },
          { status: 400 }
        );
      }

      if (
        typeof adminNotes === 'string' &&
        adminNotes.length > 5000
      ) {
        return NextResponse.json(
          { error: 'Admin notes cannot exceed 5000 characters.' },
          { status: 400 }
        );
      }

      data.adminNotes =
        typeof adminNotes === 'string'
          ? adminNotes.trim()
          : null;
    }

    if (isNew !== undefined) {
      if (typeof isNew !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid new-order flag.' },
          { status: 400 }
        );
      }

      data.isNew = isNew;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid update provided.' },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data,
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order update error:', error);

    return NextResponse.json(
      { error: 'Could not update order.' },
      { status: 400 }
    );
  }
}
