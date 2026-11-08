'use client';
import { useEffect, useMemo, useState } from 'react';

type Design = {
  colors: { primary: string; accent: string; background: string; text: string };
  hero: { badge: string; title: string; highlight: string; description: string; primaryButton: string; secondaryButton: string };
  features: Array<{ title: string; description: string }>;
  sections: { categories: boolean; featured: boolean };
};

const defaults: Design = {
  colors: { primary: '#023824', accent: '#D4AF37', background: '#FDFBF7', text: '#1F2937' },
  hero: { badge: 'Bismillah-ir-Rahman-ir-Rahim', title: 'Premium Islamic Essentials & Complete', highlight: 'Umrah Supplies', description: 'Order original towel Ihrams, non-alcoholic Arabic fragrance oils, organic Sidr honey, and high-density Janamaz with cash on delivery across Pakistan.', primaryButton: 'Shop Now', secondaryButton: 'View Ihram Collection' },
  features: [
    { title: 'Cash on Delivery', description: 'Delivered across all Pakistan' },
    { title: '100% Original Guarantee', description: 'Authentic Sunnah products' },
    { title: 'Easy Exchange', description: '7 Days Hassle-free Policy' },
    { title: 'Best Quality & Rates', description: 'Direct physical store prices' }
  ],
  sections: { categories: true, featured: true }
};

export default function WebsiteEditor() {
  const [design, setDesign] = useState<Design>(defaults);
  const [history, setHistory] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const [device, setDevice] = useState<'desktop'|'mobile'>('desktop');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Loading saved design...');

  useEffect(() => {
    fetch('/api/site-design?mode=admin').then(async r => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not load editor');
      setDesign(d.design || defaults);
      setMessage('Draft loaded. Changes are not live until you publish.');
    }).catch(e => setMessage(e.message));
  }, []);

  function change(next: Design) {
    setHistory(old => [...old.slice(-29), design]);
    setFuture([]);
    setDesign(next);
  }
  function undo() {
    if (!history.length) return;
    setFuture(old => [design, ...old]);
    setDesign(history[history.length - 1]);
    setHistory(old => old.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setHistory(old => [...old, design]);
    setDesign(future[0]);
    setFuture(old => old.slice(1));
  }
  async function save(publish: boolean) {
    setBusy(true); setMessage(publish ? 'Publishing...' : 'Saving draft...');
    try {
      const r = await fetch('/api/site-design', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ design, publish }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      setMessage(publish ? 'Published! Your website now shows these changes.' : 'Draft saved. Public website is unchanged until you publish.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Save failed'); }
    finally { setBusy(false); }
  }

  const field = (label: string, value: string, onChange: (v:string)=>void, multiline=false) => (
    <div className="block text-sm font-medium text-gray-700"><div className="flex items-center justify-between"><span>{label}</span><button type="button" onClick={()=>onChange('')} className="text-xs text-red-600 underline">Delete / Clear</button></div>
      {multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} className="mt-1 w-full border rounded-lg p-2 font-normal"/> :
      <input value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full border rounded-lg p-2 font-normal"/>}
    </div>
  );

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-emerald-950">Visual Website Customizer</h2><p className="text-sm text-gray-500">Edit the homepage text, colors and visible sections, then preview before publishing.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={undo} disabled={!history.length} className="border rounded-lg px-3 py-2 disabled:opacity-40">↶ Undo</button>
        <button onClick={redo} disabled={!future.length} className="border rounded-lg px-3 py-2 disabled:opacity-40">↷ Redo</button>
        <button onClick={()=>setDevice('desktop')} className={`rounded-lg px-3 py-2 ${device==='desktop'?'bg-emerald-900 text-white':'border'}`}>Desktop</button>
        <button onClick={()=>setDevice('mobile')} className={`rounded-lg px-3 py-2 ${device==='mobile'?'bg-emerald-900 text-white':'border'}`}>Mobile</button>
      </div>
    </div>
    <div className="grid xl:grid-cols-[minmax(280px,380px)_1fr] gap-5 items-start">
      <div className="bg-white border rounded-xl p-4 space-y-5">
        <section className="space-y-3"><h3 className="font-bold">Homepage hero text</h3>
          {field('Top badge',design.hero.badge,v=>change({...design,hero:{...design.hero,badge:v}}))}
          {field('Main heading',design.hero.title,v=>change({...design,hero:{...design.hero,title:v}}))}
          {field('Highlighted heading',design.hero.highlight,v=>change({...design,hero:{...design.hero,highlight:v}}))}
          {field('Description',design.hero.description,v=>change({...design,hero:{...design.hero,description:v}}),true)}
          {field('Main button',design.hero.primaryButton,v=>change({...design,hero:{...design.hero,primaryButton:v}}))}
          {field('Second button',design.hero.secondaryButton,v=>change({...design,hero:{...design.hero,secondaryButton:v}}))}
        </section>
        <section className="space-y-3 border-t pt-4"><h3 className="font-bold">Website colors</h3>
          {(['primary','accent','background','text'] as const).map(k=><label key={k} className="flex items-center justify-between text-sm capitalize">{k.replace('primary','Primary / dark').replace('accent','Accent / gold').replace('background','Page background')}
            <input type="color" value={design.colors[k]} onChange={e=>change({...design,colors:{...design.colors,[k]:e.target.value}})} className="w-12 h-9 border rounded cursor-pointer"/>
          </label>)}
        </section>
        <section className="space-y-3 border-t pt-4"><h3 className="font-bold">Feature highlights</h3>
          {design.features.map((f,i)=><div key={i} className="rounded-lg bg-gray-50 p-3 space-y-2"><button type="button" onClick={()=>change({...design,features:design.features.filter((_,j)=>j!==i)})} className="text-xs text-red-600 underline">Delete this feature box</button>
            {field(`Feature ${i+1} title`,f.title,v=>change({...design,features:design.features.map((x,j)=>j===i?{...x,title:v}:x)}))}
            {field('Description',f.description,v=>change({...design,features:design.features.map((x,j)=>j===i?{...x,description:v}:x)}))}
          </div>)}
          <button type="button" onClick={()=>change({...design,features:[...design.features,{title:'New feature',description:'Description'}]})} disabled={design.features.length>=8} className="border rounded-lg px-3 py-2 text-sm disabled:opacity-40">+ Add feature box</button>
        </section>
        <section className="space-y-3 border-t pt-4"><h3 className="font-bold">Homepage sections</h3>
          {(['categories','featured'] as const).map(k=><label key={k} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={design.sections[k]} onChange={e=>change({...design,sections:{...design.sections,[k]:e.target.checked}})}/>{k==='categories'?'Browse Categories':'Featured Products'}</label>)}
        </section>
        <div className="border-t pt-4 space-y-2">
          <button disabled={busy} onClick={()=>save(false)} className="w-full border border-emerald-900 text-emerald-900 rounded-lg p-3 font-semibold disabled:opacity-50">Save Draft</button>
          <button disabled={busy} onClick={()=>save(true)} className="w-full bg-emerald-900 text-white rounded-lg p-3 font-semibold disabled:opacity-50">Publish to Live Website</button>
          <p aria-live="polite" className="text-xs text-gray-600">{message}</p>
        </div>
      </div>

      <div className="bg-slate-100 border rounded-xl p-3 overflow-auto">
        <div className="text-xs font-semibold text-gray-500 mb-2">LIVE PREVIEW • {device.toUpperCase()}</div>
        <div className={`mx-auto bg-white shadow-xl overflow-hidden ${device==='mobile'?'max-w-[390px]':'max-w-full'}`} style={{color:design.colors.text,background:design.colors.background}}>
          <div className="border-b px-4 py-3 flex justify-between items-center text-sm" style={{color:design.colors.primary}}><strong>ج JANNAT IHRAM GHAR</strong><span>☰　🛍</span></div>
          <div className="p-6 md:p-10 text-center" style={{background:design.colors.primary,color:'#fff'}}>
            {design.hero.badge && <span className="inline-block text-xs border rounded-full px-3 py-1 mb-4" style={{borderColor:design.colors.accent,color:design.colors.accent}}>{design.hero.badge}</span>}
            {(design.hero.title || design.hero.highlight) && <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">{design.hero.title} <span style={{color:design.colors.accent}}>{design.hero.highlight}</span></h1>}
            {design.hero.description && <p className="text-sm opacity-80 max-w-xl mx-auto my-4">{design.hero.description}</p>}
            <div className="flex flex-wrap justify-center gap-2">{design.hero.primaryButton && <span className="px-4 py-2 rounded font-bold text-sm" style={{background:design.colors.accent,color:design.colors.primary}}>{design.hero.primaryButton}</span>}{design.hero.secondaryButton && <span className="px-4 py-2 rounded border text-sm" style={{borderColor:design.colors.accent,color:design.colors.accent}}>{design.hero.secondaryButton}</span>}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-white">{design.features.map((f,i)=><div key={i} className="text-center p-3"><div className="text-xl mb-1">✦</div><strong className="text-xs block">{f.title}</strong><span className="text-[10px] text-gray-500">{f.description}</span></div>)}</div>
          {design.sections.categories&&<div className="p-6 text-center"><h2 className="font-bold text-xl">Browse Categories</h2><div className="grid grid-cols-3 gap-2 mt-4"><div className="col-span-3 text-xs text-gray-500 bg-gray-50 rounded p-4">Your saved shop categories will appear here after you add them in Admin → Products → Manage Shop Categories.</div></div></div>}
          {design.sections.featured&&<div className="p-6 text-center" style={{background:design.colors.primary+'0D'}}><h2 className="font-bold text-xl">Featured Products</h2><div className="grid grid-cols-2 gap-2 mt-4"><div className="col-span-2 text-xs text-gray-500 bg-gray-50 rounded p-4">Choose products using the Featured checkbox in Admin → Products. No sample products are shown.</div></div></div>}
          <div className="p-5 text-center text-xs" style={{background:design.colors.primary,color:'#fff'}}>© Jannat Ihram Ghar</div>
        </div>
        <p className="text-xs text-gray-500 mt-3">Preview is a design sample. The published website keeps its existing product cards, navigation, checkout and order system.</p>
      </div>
    </div>
  </div>;
}
