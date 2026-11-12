'use client';

import { useState, type FormEvent } from 'react';
import { Check, ClipboardCopy, PackageSearch, Search, Truck } from 'lucide-react';

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

  async function trackOrder(e: FormEvent) {
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
      if (!response.ok) throw new Error(data.error || 'Order not found.');
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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

  const fieldClass = 'w-full rounded-xl border border-[#6c5424] bg-[#101010] px-4 py-3.5 text-[#f7ecd2] placeholder:text-[#82765e] outline-none transition focus:border-[#e3bf68] focus:ring-2 focus:ring-[#d4af37]/20';
  const panelClass = 'rounded-2xl border border-[#665027] bg-gradient-to-br from-[#191919] via-[#121212] to-[#080808] p-6 shadow-[0_16px_55px_rgba(0,0,0,0.4)] sm:p-8';

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12 text-[#f5ead2] sm:py-16">
      <div className="mx-auto max-w-xl">
        <header className="mb-9 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#94702e] bg-[#1d170c] shadow-[0_0_30px_rgba(212,175,55,0.12)]">
            <PackageSearch className="h-8 w-8 text-[#e8c775]" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#d6b56a]">Jannat Ihram Ghar</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#f3d58d] sm:text-4xl">Track Your Order</h1>
          <div className="mx-auto my-4 h-px w-28 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
          <p className="text-sm leading-6 text-[#bcb4a4]">Enter your order number and registered phone number to view your shipment details.</p>
        </header>

        <form onSubmit={trackOrder} className={`${panelClass} space-y-5`}>
          <div>
            <label htmlFor="order-number" className="mb-2 block text-sm font-semibold text-[#e7cb8c]">Order Number</label>
            <input id="order-number" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. JIG-123456" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="phone-number" className="mb-2 block text-sm font-semibold text-[#e7cb8c]">Phone Number</label>
            <input id="phone-number" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XXXXXXXXX" className={fieldClass} />
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-800/70 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f1d38c] bg-gradient-to-r from-[#a67b28] via-[#f0d083] to-[#ad832f] px-4 py-3.5 font-bold text-[#171105] shadow-[0_5px_24px_rgba(212,175,55,0.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            <Search className="h-5 w-5" />{loading ? 'Searching...' : 'Track My Order'}
          </button>
        </form>

        {order && (
          <section aria-label="Tracking results" className={`${panelClass} mt-6 space-y-5`}>
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-[#e8c775]" />
              <h2 className="text-xl font-bold text-[#f3d58d]">Shipment Details</h2>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-[#a9a092]">Order Number</p>
              <p className="break-all text-xl font-bold text-[#f6e1ac]">{order.orderNumber}</p>
            </div>
            <div className="border-t border-[#493a20] pt-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-[#a9a092]">Order Status</p>
              <span className="inline-flex rounded-full border border-[#a5803b] bg-[#3b2d14] px-3 py-1.5 text-sm font-semibold text-[#f3d58d]">{order.status}</span>
            </div>
            <div className="border-t border-[#493a20] pt-4">
              <p className="mb-1 text-xs uppercase tracking-wider text-[#a9a092]">Shipping Provider</p>
              <p className="text-lg font-semibold text-[#f5ead2]">{order.shippingProvider || 'Not assigned yet'}</p>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[#a9a092]">Tracking Number</p>
              {order.trackingNumber ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="break-all text-lg font-bold text-[#f6e1ac]">{order.trackingNumber}</span>
                  <button type="button" onClick={copyTrackingNumber} className="inline-flex items-center gap-2 rounded-lg border border-[#b68c42] px-4 py-2 text-sm font-semibold text-[#e8c775] transition hover:bg-[#342710]">
                    {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <p className="text-sm leading-6 text-[#bcb4a4]">Tracking details will be available once your order is shipped.</p>
              )}
            </div>
            <p className="border-t border-[#493a20] pt-4 text-xs text-[#a9a092]">Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </section>
        )}
        <p className="mt-8 text-center text-xs text-[#9d8c69]">Thank you for shopping with Jannat Ihram Ghar.</p>
      </div>
    </main>
  );
}
