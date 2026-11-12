'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  orderNotes: string | null;
  adminNotes: string | null;
  paymentMethod: string;
  paymentScreenshot: string | null;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  trackingNumber: string | null;
  shippingProvider: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    variant: string | null;
    product: { name: string; sku: string; images?: string };
    reviewInvite: {
      generationCount: number;
      lastGeneratedAt: string | null;
      expiresAt: string;
      usedAt: string | null;
    } | null;
    review: { id: string; rating: number; comment: string; status: string } | null;
  }>;
};

const orderStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const paymentStatuses = ['Pending', 'Verified', 'Rejected'];
const couriers = ['TCS', 'Leopards', 'M&P', 'PostEx', 'Pakistan Post', 'Other'];

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOrder = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Could not load order.');
      setOrder(data.order);
      setAdminNotes(data.order.adminNotes || '');
      setTrackingNumber(data.order.trackingNumber || '');
      setShippingProvider(data.order.shippingProvider || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load order.');
    }
  }, [id, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function updateOrder(payload: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update order.');
      setMessage(successMessage);
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order.');
    } finally {
      setBusy(false);
    }
  }

  if (!order && !error) {
    return <main className="mx-auto max-w-5xl p-6 text-amber-300">Loading order details...</main>;
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 p-6 text-zinc-100">
        <button onClick={() => router.push('/admin/dashboard')} className="text-amber-400 underline">← Back to dashboard</button>
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  const isCOD = order.paymentMethod === 'Cash on Delivery (COD)';

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 min-h-screen text-zinc-100 bg-[#090909] rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => router.push('/admin/dashboard')} className="mb-2 text-sm text-amber-400 underline">← Back to orders</button>
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-300">{order.orderNumber}</h1>
          <p className="text-sm text-zinc-400">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300">{order.status}</span>
      </div>

      {error && <p className="rounded border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">{message}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#151515] shadow-lg shadow-black/30 p-5">
          <h2 className="font-bold text-lg text-amber-300">Customer details</h2>
          <p><span className="text-zinc-400">Name:</span> {order.customerName}</p>
          <p><span className="text-zinc-400">Phone:</span> {order.customerPhone}</p>
          <p><span className="text-zinc-400">Address:</span> {order.deliveryAddress}</p>
          <p><span className="text-zinc-400">City:</span> {order.city}</p>
          {order.orderNotes && <p><span className="text-zinc-400">Customer note:</span> {order.orderNotes}</p>}
        </div>

        <div className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#151515] shadow-lg shadow-black/30 p-5">
          <h2 className="font-bold text-lg text-amber-300">Payment details</h2>
          <p><span className="text-zinc-400">Method:</span> {order.paymentMethod}</p>
          <p><span className="text-zinc-400">Payment status:</span> {isCOD ? 'Not Required' : order.paymentStatus}</p>
          {order.paymentScreenshot && (
            <a href={order.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="inline-block text-amber-400 underline">View payment screenshot</a>
          )}
          <div className="border-t border-amber-500/20 pt-3 text-sm space-y-1">
            <p>Subtotal: PKR {order.subtotal.toLocaleString()}</p>
            <p>Delivery: PKR {order.deliveryFee.toLocaleString()}</p>
            {order.discount > 0 && <p>Discount: -PKR {order.discount.toLocaleString()}</p>}
            <p className="mt-2 text-lg font-bold text-amber-300">Total: PKR {order.total.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-amber-500/25 bg-[#151515] shadow-lg shadow-black/30 p-5">
        <h2 className="font-bold text-lg text-amber-300">Ordered products</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex flex-wrap justify-between gap-3 border-b border-amber-500/20 pb-4 last:border-0 last:pb-0">
            <div>
              <p className="font-semibold text-amber-100">{item.product.name}</p>
              <p className="text-xs text-zinc-400">SKU: {item.product.sku}</p>
              {item.variant && <p className="text-sm text-zinc-300">Variant: {item.variant}</p>}
              <p className="text-sm text-zinc-300">Quantity: {item.quantity}</p>
              {item.reviewInvite ? (
                <div className="mt-2 text-xs text-zinc-300">
                  <p>Review link generated {item.reviewInvite.generationCount} time{item.reviewInvite.generationCount === 1 ? '' : 's'}</p>
                  {item.reviewInvite.lastGeneratedAt && <p>Last generated: {new Date(item.reviewInvite.lastGeneratedAt).toLocaleString()}</p>}
                  {item.reviewInvite.usedAt && <p className="text-amber-400">Review link used</p>}
                </div>
              ) : <p className="mt-2 text-xs text-zinc-400">Review link not generated yet</p>}
              {item.review && <p className="mt-1 text-xs">Review received: {item.review.rating}/5 · {item.review.status}</p>}
            </div>
            <p className="font-semibold text-amber-100">PKR {(item.price * item.quantity).toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#151515] shadow-lg shadow-black/30 p-5">
          <h2 className="font-bold text-lg text-amber-300">Order management</h2>
          <label className="block text-sm font-medium text-zinc-300">Order status</label>
          <select value={order.status} onChange={(e) => updateOrder({ status: e.target.value }, 'Order status updated.')} disabled={busy} className="w-full rounded-lg border border-amber-500/30 bg-zinc-900 p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400">
            {orderStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          {!isCOD && <>
            <label className="block text-sm font-medium text-zinc-300">Payment status</label>
            <select value={order.paymentStatus} onChange={(e) => updateOrder({ paymentStatus: e.target.value }, 'Payment status updated.')} disabled={busy} className="w-full rounded-lg border border-amber-500/30 bg-zinc-900 p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400">
              {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </>}
        </div>

        <div className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#151515] shadow-lg shadow-black/30 p-5">
          <h2 className="font-bold text-lg text-amber-300">Shipping details</h2>
          <label className="block text-sm font-medium text-zinc-300">Courier / shipping provider</label>
          <select value={shippingProvider} onChange={(e) => setShippingProvider(e.target.value)} className="w-full rounded-lg border border-amber-500/30 bg-zinc-900 p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400">
            <option value="">Select courier</option>
            {couriers.map((courier) => <option key={courier}>{courier}</option>)}
          </select>
          <label className="block text-sm font-medium text-zinc-300">Tracking number</label>
          <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} maxLength={100} placeholder="Enter tracking number" className="w-full rounded-lg border border-amber-500/30 bg-zinc-900 p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400" />
          <button disabled={busy || !trackingNumber.trim() || !shippingProvider.trim()} onClick={() => updateOrder({ trackingNumber, shippingProvider }, 'Shipping details saved.')} className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-300 px-5 py-2.5 font-bold text-black hover:brightness-110 disabled:opacity-50">Save shipping details</button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-amber-500/25 bg-[#151515] shadow-lg shadow-black/30 p-5">
        <div>
          <h2 className="font-bold text-lg text-amber-300">Private admin notes</h2>
          <p className="text-sm text-zinc-400">These notes are only visible in the admin dashboard, not to the customer.</p>
        </div>
        <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} maxLength={5000} rows={5} placeholder="Write internal notes about this order..." className="w-full rounded-lg border border-amber-500/30 bg-zinc-900 p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-zinc-400">{adminNotes.length}/5000 characters</span>
          <button disabled={busy} onClick={() => updateOrder({ adminNotes }, 'Admin notes saved.')} className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-300 px-5 py-2.5 font-bold text-black hover:brightness-110 disabled:opacity-50">Save admin notes</button>
        </div>
      </section>
    </main>
  );
}
