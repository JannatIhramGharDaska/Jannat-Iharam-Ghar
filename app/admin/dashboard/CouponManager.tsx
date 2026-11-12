'use client';
import { useEffect, useState } from 'react';

type Coupon = { id: string; code: string; type: string; value: number; minSubtotal: number; maxUses: number | null; usedCount: number; expiresAt: string | null; active: boolean };
export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'PERCENT', value: '', minSubtotal: '0', maxUses: '', expiresAt: '' });
  const load = async () => { const r = await fetch('/api/admin/coupons'); const d = await r.json(); if (r.ok) setCoupons(d.coupons || []); else setError(d.error || 'Cannot load coupons'); };
  useEffect(() => { void load(); }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Could not create coupon');
      setForm({ code: '', type: 'PERCENT', value: '', minSubtotal: '0', maxUses: '', expiresAt: '' }); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); } finally { setBusy(false); }
  };
  const toggle = async (c: Coupon) => {
    setError(''); const r = await fetch('/api/admin/coupons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, active: !c.active }) });
    if (!r.ok) { const d = await r.json(); setError(d.error || 'Could not update'); } else await load();
  };
  return <section className="space-y-5">
    <h2 className="text-xl font-bold text-[#F5D780]">Discount Coupons</h2>
    <form onSubmit={create} className="bg-[#171717] border border-[#8C692F] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <label className="text-sm">Coupon Code<input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="JIG10" className="w-full mt-1" /></label>
      <label className="text-sm">Discount Type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full mt-1"><option value="PERCENT">Percentage (%)</option><option value="FIXED">Fixed (PKR)</option></select></label>
      <label className="text-sm">Discount Value<input required type="number" min="0.01" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="w-full mt-1" /></label>
      <label className="text-sm">Minimum Product Subtotal<input type="number" min="0" value={form.minSubtotal} onChange={e => setForm({ ...form, minSubtotal: e.target.value })} className="w-full mt-1" /></label>
      <label className="text-sm">Usage Limit (optional)<input type="number" min="1" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} className="w-full mt-1" /></label>
      <label className="text-sm">Expiry Date (optional)<input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="w-full mt-1" /></label>
      <button disabled={busy} className="bg-[#E7B84F] text-black font-bold rounded-lg p-3 sm:col-span-2 lg:col-span-3">{busy ? 'Saving...' : 'Create Coupon'}</button>
    </form>
    {error && <p className="text-red-400">{error}</p>}
    <div className="grid gap-3">{coupons.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 bg-[#171717] border border-[#70562d] rounded-xl p-4">
      <div><strong className="text-[#F5D780]">{c.code}</strong><p className="text-sm text-[#D1C2A7]">{c.type === 'PERCENT' ? `${c.value}%` : `PKR ${c.value}`} off · Min PKR {c.minSubtotal} · Used {c.usedCount}/{c.maxUses ?? '∞'} · Expires {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</p></div>
      <button onClick={() => toggle(c)} className="border border-[#D8AD50] rounded-lg px-4 py-2 text-sm">{c.active ? 'Deactivate' : 'Activate'}</button>
    </div>)}</div>
  </section>;
}
