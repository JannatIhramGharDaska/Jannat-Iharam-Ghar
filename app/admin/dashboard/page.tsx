'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = { id:string; sku:string; name:string; price:number; stock:number; categoryName?:string };
type Order = { id:string; orderNumber:string; customerName:string; customerPhone:string; city:string; total:number; status:string; createdAt:string };
type Asset = { id:string; slot:string; label:string; url:string };
type Tab = 'orders'|'products'|'media';

export default function Dashboard() {
  const router = useRouter();
  const [tab,setTab] = useState<Tab>('orders');
  const [orders,setOrders] = useState<Order[]>([]);
  const [products,setProducts] = useState<Product[]>([]);
  const [assets,setAssets] = useState<Asset[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [form,setForm] = useState({name:'',sku:'',price:'',stock:'0',category:'Ihram',description:''});
  const [mediaSlot,setMediaSlot] = useState('site-logo');
  const [mediaFile,setMediaFile] = useState<File|null>(null);
  const [mediaBusy,setMediaBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const me = await fetch('/api/admin/me').then(r=>r.json());
      if (!me.authenticated) { router.replace('/admin/login'); return; }
      const [a,b,c] = await Promise.all([
        fetch('/api/orders').then(r=>r.json()), fetch('/api/products').then(r=>r.json()), fetch('/api/media').then(r=>r.json())
      ]);
      setOrders(a.orders||[]); setProducts(b.products||[]); setAssets(c.assets||[]);
    } catch { setError('Could not load dashboard data.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[]);

  async function add(e:React.FormEvent) {
    e.preventDefault(); setError('');
    const r=await fetch('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    const d=await r.json();
    if(!r.ok){setError(d.error||'Could not add product');return;}
    setForm({name:'',sku:'',price:'',stock:'0',category:'Ihram',description:''}); await load();
  }
  async function status(id:string,value:string) {
    const r=await fetch('/api/orders/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:value})});
    if(!r.ok){setError('Could not update order status');return;} await load();
  }
  async function uploadMedia(e:React.FormEvent) {
    e.preventDefault(); if(!mediaFile){setError('Please choose an image first.');return;}
    setMediaBusy(true);setError('');
    const fd=new FormData();fd.append('file',mediaFile);fd.append('slot',mediaSlot);fd.append('label',mediaSlot.replaceAll('-',' '));
    const r=await fetch('/api/media',{method:'POST',body:fd});const d=await r.json();
    if(!r.ok)setError(d.error||'Upload failed');else{setMediaFile(null);const el=document.getElementById('media-file') as HTMLInputElement|null;if(el)el.value='';await load();}
    setMediaBusy(false);
  }
  async function deleteMedia(slot:string) {
    if(!confirm('Delete this image?'))return;
    const r=await fetch('/api/media',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({slot})});
    const d=await r.json();if(!r.ok)setError(d.error||'Delete failed');else await load();
  }
  async function logout(){await fetch('/api/admin/login',{method:'DELETE'});router.replace('/admin/login');}
  const categoryOptions=Array.from(new Set(products.map(p=>p.categoryName).filter((v):v is string=>Boolean(v))));
  const categorySlug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  return <main className="max-w-7xl mx-auto px-4 py-8">
    <div className="flex flex-wrap justify-between gap-3 items-center mb-6"><div><h1 className="text-2xl font-bold text-emerald-950">Admin Dashboard</h1><p className="text-sm text-gray-500">Jannat Ihram Ghar inventory and orders</p></div><button onClick={logout} className="border rounded px-4 py-2">Logout</button></div>
    <div className="flex flex-wrap gap-2 mb-5">
      {(['orders','products','media'] as Tab[]).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded capitalize ${tab===t?'bg-emerald-900 text-white':'bg-gray-200'}`}>{t==='media'?'Image Management':t}</button>)}
    </div>
    {error&&<p className="text-red-600 mb-3">{error}</p>}
    {loading?<p>Loading...</p>:<>
      {tab==='orders'&&<div className="bg-white border rounded-lg overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left">{['Order','Customer','Phone','City','Total','Status'].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{orders.map(o=><tr key={o.id} className="border-t"><td className="p-3">{o.orderNumber}</td><td className="p-3">{o.customerName}</td><td className="p-3">{o.customerPhone}</td><td className="p-3">{o.city}</td><td className="p-3">PKR {o.total.toLocaleString()}</td><td className="p-3"><select value={o.status} onChange={e=>status(o.id,e.target.value)} className="border rounded p-1">{['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'].map(v=><option key={v}>{v}</option>)}</select></td></tr>)}</tbody></table>{!orders.length&&<p className="p-5 text-gray-500">No orders yet.</p>}</div>}
      {tab==='products'&&<div className="space-y-6"><form onSubmit={add} className="bg-white border rounded-lg p-5 grid sm:grid-cols-2 gap-3"><h2 className="font-bold sm:col-span-2">Add Product</h2>{(['name','sku','price','stock','category','description'] as const).map(k=><input key={k} required={['name','sku','price','category'].includes(k)} placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="border rounded p-2"/>)}<button className="bg-emerald-900 text-white rounded p-3 sm:col-span-2">Save Product</button></form><div className="bg-white border rounded-lg overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left">{['SKU','Name','Category','Price','Stock'].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-t"><td className="p-3">{p.sku}</td><td className="p-3">{p.name}</td><td className="p-3">{p.categoryName}</td><td className="p-3">PKR {p.price.toLocaleString()}</td><td className="p-3">{p.stock}</td></tr>)}</tbody></table></div></div>}
      {tab==='media'&&<div className="space-y-5"><form onSubmit={uploadMedia} className="bg-white border rounded-lg p-5 space-y-3"><h2 className="font-bold text-lg">Upload / Replace Website Image</h2><p className="text-sm text-gray-500">Images are stored online in Cloudinary, not on this computer.</p><label className="block text-sm font-medium">Image location</label><select value={mediaSlot} onChange={e=>setMediaSlot(e.target.value)} className="border rounded p-2 w-full"><option value="site-logo">Website Logo</option><option value="hero-banner">Homepage Main Banner</option>{products.map(p=><option key={p.id} value={`product-image:${p.id}`}>Product: {p.name}</option>)}{categoryOptions.map(name=><option key={name} value={`category-image:${categorySlug(name)}`}>Category: {name}</option>)}</select><input id="media-file" type="file" accept="image/*" onChange={e=>setMediaFile(e.target.files?.[0]||null)} className="block w-full border rounded p-2"/><button disabled={mediaBusy} className="bg-emerald-900 text-white rounded px-5 py-3 disabled:opacity-50">{mediaBusy?'Uploading...':'Upload / Replace Image'}</button></form><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{assets.map(a=><div key={a.id} className="bg-white border rounded-lg p-3"><img src={a.url} alt={a.label} className="w-full h-40 object-contain bg-gray-50 rounded"/><p className="font-semibold text-sm mt-2">{a.label}</p><p className="text-xs text-gray-500 break-all">{a.slot}</p><button onClick={()=>deleteMedia(a.slot)} className="mt-2 text-sm text-red-600 border border-red-200 rounded px-3 py-1">Delete</button></div>)}</div>{!assets.length&&<p className="text-sm text-gray-500">No custom images uploaded yet.</p>}</div>}
    </>}
  </main>;
}
