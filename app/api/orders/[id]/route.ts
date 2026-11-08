
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

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

    const { status, paymentStatus } = body;

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
