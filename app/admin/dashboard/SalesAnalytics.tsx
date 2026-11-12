'use client';

import { useMemo, useState } from 'react';

type Item = { quantity: number; price: number; product: { name: string; sku: string } };
type Order = {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: Item[];
};

const money = (value: number) => `PKR ${value.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const pkDate = (date: string) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(date));
const monthKey = (date: string) => pkDate(date).slice(0, 7);
const isCOD = (order: Order) => /cash on delivery|\bcod\b/i.test(order.paymentMethod);
const isCancelled = (order: Order) => order.status.toLowerCase() === 'cancelled';
const isCollected = (order: Order) => !isCancelled(order) &&
  (isCOD(order) ? order.status === 'Delivered' : order.paymentStatus === 'Verified');

export default function SalesAnalytics({ orders }: { orders: Order[] }) {
  const [period, setPeriod] = useState<'all' | '30' | '90'>('all');
  const data = useMemo(() => {
    const today = pkDate(new Date().toISOString());
    const cutoff = new Date();
    if (period !== 'all') cutoff.setDate(cutoff.getDate() - Number(period));
    const filtered = orders.filter(o => period === 'all' || new Date(o.createdAt) >= cutoff);
    const active = filtered.filter(o => !isCancelled(o));
    const collected = filtered.filter(isCollected);
    const sum = (rows: Order[]) => rows.reduce((total, o) => total + o.total, 0);
    const months = Array.from({ length: 6 }, (_, i) => {
      const now = new Date();
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1, 12));
      const key = monthKey(date.toISOString());
      return { key, label: new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(date), value: sum(collected.filter(o => monthKey(o.createdAt) === key)) };
    });
    const best = new Map<string, { name: string; quantity: number; value: number }>();
    active.forEach(o => o.items?.forEach(item => {
      const key = item.product?.sku || item.product?.name || 'Unknown';
      const old = best.get(key) || { name: item.product?.name || 'Unknown', quantity: 0, value: 0 };
      old.quantity += item.quantity;
      old.value += item.price * item.quantity;
      best.set(key, old);
    }));
    return {
      todayOrders: filtered.filter(o => pkDate(o.createdAt) === today),
      active, collected, filtered,
      orderValue: sum(active), collectedRevenue: sum(collected),
      todayRevenue: sum(collected.filter(o => pkDate(o.createdAt) === today)),
      cancelled: filtered.filter(isCancelled).length,
      months, best: [...best.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
      cod: active.filter(isCOD).length, online: active.filter(o => !isCOD(o)).length,
    };
  }, [orders, period]);
  const max = Math.max(1, ...data.months.map(m => m.value));
  const stats = [
    ['Collected Revenue', money(data.collectedRevenue)],
    ["Today's Collected", money(data.todayRevenue)],
    ['Order Value (Active)', money(data.orderValue)],
    ['Total Orders', String(data.filtered.length)],
    ['Cancelled Orders', String(data.cancelled)],
    ['Pending Collection', money(Math.max(0, data.orderValue - data.collectedRevenue))],
  ];
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div><h2 className="text-xl font-bold text-emerald-950">Sales Analytics</h2>
          <p className="text-xs text-gray-500">Pakistan time · COD counted as collected on delivery; online payments when verified</p></div>
        <select aria-label="Analytics period" value={period} onChange={e => setPeriod(e.target.value as 'all' | '30' | '90')} className="border rounded-lg p-2 bg-white">
          <option value="all">All time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
        </select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(([label, value]) => <div key={label} className="rounded-xl bg-white border p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">{label}</p><p className="font-bold text-lg sm:text-2xl text-emerald-950 break-words">{value}</p>
        </div>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border p-5">
          <h3 className="font-bold mb-1">Collected Revenue · Last 6 Months</h3>
          <p className="text-xs text-gray-500 mb-5">Monthly figures reflect collected payments, not all orders</p>
          <div className="flex items-end gap-3 h-48 border-b pb-2">
            {data.months.map(m => <div key={m.key} className="flex-1 h-full flex flex-col justify-end items-center gap-2 min-w-0">
              <span className="text-[10px] text-gray-600 truncate max-w-full" title={money(m.value)}>{m.value ? Math.round(m.value / 1000) + 'k' : '0'}</span>
              <div className="w-full max-w-12 rounded-t bg-emerald-700" style={{ height: `${Math.max(m.value ? 3 : 0, m.value / max * 100)}%` }} title={`${m.label}: ${money(m.value)}`} />
            </div>)}
          </div>
          <div className="flex gap-3 mt-2">{data.months.map(m => <span key={m.key} className="flex-1 text-center text-[10px] text-gray-500">{m.label}</span>)}</div>
        </div>
        <div className="rounded-xl bg-white border p-5 space-y-4">
          <h3 className="font-bold">Order Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">COD Orders</p><p className="text-2xl font-bold">{data.cod}</p></div>
            <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Online Orders</p><p className="text-2xl font-bold">{data.online}</p></div>
          </div>
          <div className="space-y-2">{['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => <div key={status} className="flex justify-between text-sm border-b pb-2"><span>{status}</span><strong>{data.filtered.filter(o => o.status === status).length}</strong></div>)}</div>
        </div>
      </div>
      <div className="rounded-xl bg-white border p-5">
        <h3 className="font-bold mb-1">Best Selling Products</h3>
        <p className="text-xs text-gray-500 mb-4">Based on quantities ordered, excluding cancelled orders</p>
        {data.best.length === 0 ? <p className="text-sm text-gray-500">No product sales yet.</p> :
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-2">Product</th><th className="py-2">Units</th><th className="py-2">Order Value</th></tr></thead><tbody>{data.best.map(item => <tr key={item.name} className="border-b"><td className="py-3">{item.name}</td><td>{item.quantity}</td><td>{money(item.value)}</td></tr>)}</tbody></table></div>}
      </div>
    </section>
  );
}
