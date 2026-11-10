
'use client';

import { useState } from 'react';

type TrackingOrder = {
  orderNumber: string;
  status: string;
  trackingNumber: string | null;
  shippingProvider: string | null;
  createdAt: string;
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function trackOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    setCopied(false);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order not found.');
      }

      setOrder(data.order);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyTrackingNumber() {
    if (!order?.trackingNumber) return;

    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
    } catch {
      setError('Could not copy tracking number.');
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-950">
            Track Your Order
          </h1>
          <p className="text-gray-500 mt-2">
            Jannat Ihram Ghar
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Enter your order details to find your shipment.
          </p>
        </div>

        <form
          onSubmit={trackOrder}
          className="bg-white rounded-2xl border shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">
              Order Number
            </label>
            <input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. JIG-12345678"
              className="w-full border rounded-lg p-3 outline-none focus:border-emerald-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XXXXXXXXX"
              className="w-full border rounded-lg p-3 outline-none focus:border-emerald-800"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-950 text-white rounded-lg p-3 font-semibold hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track My Order'}
          </button>
        </form>

        {order && (
          <div className="mt-6 bg-white rounded-2xl border shadow-sm p-6 space-y-5">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <h2 className="text-xl font-bold text-emerald-950">
                {order.orderNumber}
              </h2>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Order Status</p>
              <span className="inline-block mt-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-sm font-semibold">
                {order.status}
              </span>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Shipping Provider</p>
              <h3 className="font-semibold text-lg">
                {order.shippingProvider || 'Not assigned yet'}
              </h3>
            </div>

            <div>
              <p className="text-sm text-gray-500">Tracking Number</p>

              {order.trackingNumber ? (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                  <span className="font-bold text-lg break-all">
                    {order.trackingNumber}
                  </span>

                  <button
                    type="button"
                    onClick={copyTrackingNumber}
                    className="border border-emerald-800 text-emerald-900 rounded-lg px-4 py-2 text-sm"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 mt-1">
                  Tracking details will be available once your order is shipped.
                </p>
              )}
            </div>

            <div className="border-t pt-4 text-xs text-gray-500">
              Order Date: {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Thank you for shopping with Jannat Ihram Ghar.
        </p>
      </div>
    </main>
  );
}
