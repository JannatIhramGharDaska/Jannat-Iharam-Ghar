'use client';
import WebsiteEditor from './WebsiteEditor';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = { id:string; sku:string; name:string; description:string; price:number; salePrice:number|null; stock:number; featured:boolean; images:string; categoryId:string; categoryName?:string };
type Order = { id:string; orderNumber:string; customerName:string; customerPhone:string; deliveryAddress:string; city:string; orderNotes?:string|null; paymentMethod:string; subtotal:number; deliveryFee:number; total:number; status:string; createdAt:string; items:Array<{id:string;quantity:number;price:number;variant?:string|null;product:{name:string;sku:string}}> };
type Asset = { id:string; slot:string; label:string; url:string };
type Tab = 'orders'|'products'|'media'|'design';

export default function Dashboard() {
  const router = useRouter();
  const [tab,setTab] = useState<Tab>('orders');
  const [orders,setOrders] = useState<Order[]>([]);
  const [products,setProducts] = useState<Product[]>([]);
  const [assets,setAssets] = useState<Asset[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [form,setForm] = useState({name:'',sku:'',price:'',stock:'0',category:'Ihram',description:''});
  const [categories,setCategories] = useState<Array<{id:string;name:string;_count?:{products:number}}>>([]);
  const [categoryName,setCategoryName] = useState('');
  const [editingProduct,setEditingProduct] = useState<Product|null>(null);
  const [mediaSlot,setMediaSlot] = useState('site-logo');
  const [mediaFile,setMediaFile] = useState<File|null>(null);
  const [mediaBusy,setMediaBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const me = await fetch('/api/admin/me').then(r=>r.json());
      if (!me.authenticated) { router.replace('/admin/login'); return; }
      const [a,b,c,d] = await Promise.all([
        fetch('/api/orders').then(r=>r.json()), fetch('/api/products').then(r=>r.json()), fetch('/api/media').then(r=>r.json()), fetch('/api/categories').then(r=>r.json())
      ]);
      setOrders(a.orders||[]); setProducts(b.products||[]); setAssets(c.assets||[]); setCategories(d.categories||[]);
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
  async function addCategory(e:React.FormEvent) { e.preventDefault(); setError(''); const r=await fetch('/api/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:categoryName})}); const d=await r.json(); if(!r.ok){setError(d.error||'Could not add category');return;} setCategoryName(''); await load(); }
  async function deleteCategory(id:string) { if(!confirm('Delete this category?'))return; const r=await fetch('/api/categories/'+id,{method:'DELETE'}); const d=await r.json(); if(!r.ok){setError(d.error||'Could not delete category');return;} await load(); }
  async function updateProduct(e:React.FormEvent) { e.preventDefault(); if(!editingProduct)return; const r=await fetch('/api/products/'+editingProduct.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:editingProduct.name,sku:editingProduct.sku,description:editingProduct.description,price:editingProduct.price,stock:editingProduct.stock,salePrice:editingProduct.salePrice,featured:editingProduct.featured,images:editingProduct.images})}); const d=await r.json(); if(!r.ok){setError(d.error||'Could not update product');return;} setEditingProduct(null); await load(); }
  async function toggleFeatured(p:Product) { const r=await fetch('/api/products/'+p.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({featured:!p.featured})}); if(!r.ok){setError('Could not update featured product');return;} await load(); }
  async function logout(){await fetch('/api/admin/login',{method:'DELETE'});router.replace('/admin/login');}
  const categoryOptions=Array.from(new Set(products.map(p=>p.categoryName).filter((v):v is string=>Boolean(v))));
  const categorySlug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  return <main className="max-w-7xl mx-auto px-4 py-8">
    <div className="flex flex-wrap justify-between gap-3 items-center mb-6"><div><h1 className="text-2xl font-bold text-emerald-950">Admin Dashboard</h1><p className="text-sm text-gray-500">Jannat Ihram Ghar inventory and orders</p></div><button onClick={logout} className="border rounded px-4 py-2">Logout</button></div>
    <div className="flex flex-wrap gap-2 mb-5">
      {(['orders','products','media','design'] as Tab[]).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded capitalize ${tab===t?'bg-emerald-900 text-white':'bg-gray-200'}`}>{t==='media'?'Image Management':t==='design'?'Website Editor':t}</button>)}
    </div>
    {error&&<p className="text-red-600 mb-3">{error}</p>}
    {loading?<p>Loading...</p>:<>
      {tab==='orders'&&<div className="bg-white border rounded-lg overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left">{['Order / Date','Customer','Phone','Delivery Address','City','Payment','Items','Total','Status'].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{orders.map(o=><tr key={o.id} className="border-t align-top"><td className="p-3 whitespace-nowrap">{o.orderNumber}<span className="block text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</span></td><td className="p-3">{o.customerName}</td><td className="p-3 whitespace-nowrap">{o.customerPhone}</td><td className="p-3 min-w-48">{o.deliveryAddress}{o.orderNotes&&<span className="block text-xs text-gray-500">Note: {o.orderNotes}</span>}</td><td className="p-3">{o.city}</td><td className="p-3">{o.paymentMethod}</td><td className="p-3 min-w-48">{o.items?.map((it,i)=><div key={it.id||i} className="mb-1">{it.product?.name||'Product'} × {it.quantity}<span className="block text-xs text-gray-500">PKR {(it.price*it.quantity).toLocaleString()}</span></div>)}</td><td className="p-3 whitespace-nowrap">PKR {o.total.toLocaleString()}</td><td className="p-3"><select value={o.status} onChange={e=>status(o.id,e.target.value)} className="border rounded p-1">{['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'].map(v=><option key={v}>{v}</option>)}</select></td></tr>)}</tbody></table>{!orders.length&&<p className="p-5 text-gray-500">No orders yet.</p>}</div>}
      {tab==='products'&&<div className="space-y-6"><form onSubmit={add} className="bg-white border rounded-lg p-5 grid sm:grid-cols-2 gap-3"><h2 className="font-bold sm:col-span-2">Add Product</h2>{(['name','sku','price','stock','category','description'] as const).map(k=><input key={k} required={['name','sku','price','category'].includes(k)} placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="border rounded p-2"/>)}<button className="bg-emerald-900 text-white rounded p-3 sm:col-span-2">Save Product</button></form>
      <section className="bg-white border rounded-lg p-5 space-y-3"><h2 className="font-bold">Manage Shop Categories</h2><form onSubmit={addCategory} className="flex gap-2"><input value={categoryName} onChange={e=>setCategoryName(e.target.value)} required placeholder="New category name" className="border rounded p-2 flex-1"/><button className="bg-emerald-900 text-white rounded px-4">Add Category</button></form><div className="flex flex-wrap gap-2">{categories.map(c=><span key={c.id} className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-sm">{c.name} <small className="text-gray-500">({c._count?.products||0})</small><button onClick={()=>deleteCategory(c.id)} className="text-red-600 font-bold" title="Delete category">×</button></span>)}</div></section>
      {editingProduct&&<form onSubmit={updateProduct} className="bg-amber-50 border border-amber-200 rounded-lg p-5 grid sm:grid-cols-2 gap-3"><h2 className="font-bold sm:col-span-2">Edit Product: {editingProduct.name}</h2>{(['name','sku','price','salePrice','stock','description'] as const).map(k=><label key={k} className="text-xs font-semibold capitalize">{k}<input value={(editingProduct as any)[k] ?? ''} onChange={e=>setEditingProduct({...editingProduct,[k]:k==='price'||k==='salePrice'||k==='stock'?(e.target.value===''?null:Number(e.target.value)):e.target.value})} className="border rounded p-2 w-full mt-1"/></label>)}<label className="text-xs font-semibold sm:col-span-2">Product image URL (first image)<input value={(()=>{try{return JSON.parse(editingProduct.images||'[]')[0]||''}catch{return ''}})()} onChange={e=>setEditingProduct({...editingProduct,images:JSON.stringify([e.target.value])})} className="border rounded p-2 w-full mt-1" placeholder="https://..."/></label><label className="text-xs font-semibold">Category<select value={editingProduct.categoryId} onChange={e=>setEditingProduct({...editingProduct,categoryId:e.target.value})} className="border rounded p-2 w-full mt-1">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-sm"><input type="checkbox" checked={editingProduct.featured} onChange={e=>setEditingProduct({...editingProduct,featured:e.target.checked})}/> Show on homepage as featured</label><div className="flex gap-2 sm:col-span-2"><button className="bg-emerald-900 text-white rounded px-4 py-2">Save Changes</button><button type="button" onClick={()=>setEditingProduct(null)} className="border rounded px-4 py-2">Cancel</button></div></form>}
      <div className="bg-white border rounded-lg overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left">{['SKU','Name','Category','Price','Stock','Featured','Actions'].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-t"><td className="p-3">{p.sku}</td><td className="p-3">{p.name}</td><td className="p-3">{p.categoryName}</td><td className="p-3">PKR {p.price.toLocaleString()}</td><td className="p-3">{p.stock}</td><td className="p-3"><input type="checkbox" checked={!!p.featured} onChange={()=>toggleFeatured(p)}/></td><td className="p-3"><button onClick={()=>setEditingProduct({...p})} className="text-emerald-900 underline">Edit</button></td></tr>)}</tbody></table></div></div>}
      {tab==='design'&&<WebsiteEditor/>}
      {tab==='media'&&<div className="space-y-5"><form onSubmit={uploadMedia} className="bg-white border rounded-lg p-5 space-y-3"><h2 className="font-bold text-lg">Upload / Replace Website Image</h2><p className="text-sm text-gray-500">Images are stored online in Cloudinary, not on this computer.</p><label className="block text-sm font-medium">Image location</label><select value={mediaSlot} onChange={e=>setMediaSlot(e.target.value)} className="border rounded p-2 w-full"><option value="site-logo">Website Logo</option><option value="hero-banner">Homepage Main Banner</option>{products.map(p=><option key={p.id} value={`product-image:${p.id}`}>Product: {p.name}</option>)}{categoryOptions.map(name=><option key={name} value={`category-image:${categorySlug(name)}`}>Category: {name}</option>)}</select><input id="media-file" type="file" accept="image/*" onChange={e=>setMediaFile(e.target.files?.[0]||null)} className="block w-full border rounded p-2"/><button disabled={mediaBusy} className="bg-emerald-900 text-white rounded px-5 py-3 disabled:opacity-50">{mediaBusy?'Uploading...':'Upload / Replace Image'}</button></form><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{assets.map(a=><div key={a.id} className="bg-white border rounded-lg p-3"><img src={a.url} alt={a.label} className="w-full h-40 object-contain bg-gray-50 rounded"/><p className="font-semibold text-sm mt-2">{a.label}</p><p className="text-xs text-gray-500 break-all">{a.slot}</p><button onClick={()=>deleteMedia(a.slot)} className="mt-2 text-sm text-red-600 border border-red-200 rounded px-3 py-1">Delete</button></div>)}</div>{!assets.length&&<p className="text-sm text-gray-500">No custom images uploaded yet.</p>}</div>}
    </>}
  </main>;
}
