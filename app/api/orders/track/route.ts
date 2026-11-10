
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizePhone(value: string) {
  return value.replace(/\D/g, '').replace(/^92/, '0');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderNumber = String(body.orderNumber || '')
      .trim()
      .toUpperCase();

    const phone = normalizePhone(String(body.phone || ''));

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: 'Order number and phone number are required.' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        customerPhone: true,
        status: true,
        trackingNumber: true,
        shippingProvider: true,
        createdAt: true,
      },
    });

    if (
      !order ||
      normalizePhone(order.customerPhone) !== phone
    ) {
      return NextResponse.json(
        { error: 'Order not found. Please check your details.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
          shippingProvider: order.shippingProvider,
          createdAt: order.createdAt,
        },
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Order tracking error:', error);

    return NextResponse.json(
      { error: 'Could not track order. Please try again.' },
      { status: 500 }
    );
  }
}
