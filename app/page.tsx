import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RefreshCw, Award, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { prisma } from '@/lib/prisma';
import { DEFAULT_SITE_DESIGN, normalizeSiteDesign } from '@/lib/site-design';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [media, savedDesign, savedCategories, featuredRows] = await Promise.all([
    prisma.mediaAsset.findMany(),
    prisma.siteDesign.findUnique({ where: { id: 'main' }, select: { published: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({ where: { featured: true, stock: { gt: 0 } }, include: { category: true }, orderBy: { updatedAt: 'desc' }, take: 8 })
  ]);
  const design = normalizeSiteDesign(savedDesign?.published || DEFAULT_SITE_DESIGN);
  const mediaBySlot = Object.fromEntries(media.map(item => [item.slot, item.url]));
  const featuredProducts = featuredRows.map(p => ({ ...p, categoryName: p.category.name }));


  const categories = savedCategories.map(c => ({ title: c.name, slug: c.name, img: c.imageUrl || '/images/placeholder.svg' }));

  return (
    <div style={{ backgroundColor: design.colors.background, color: design.colors.text }}>
      {/* Hero Banner */}
      <section className="relative text-white overflow-hidden py-16 lg:py-24" style={{ backgroundColor: design.colors.primary }}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 text-center md:text-left">
            {design.hero.badge && <span className="inline-block bg-emerald-900 border text-xs px-3.5 py-1 rounded-full font-semibold uppercase tracking-widest" style={{ borderColor: design.colors.accent, color: design.colors.accent }}>{design.hero.badge}</span>}
            {(design.hero.title || design.hero.highlight) && <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {design.hero.title} {design.hero.highlight && <span style={{ color: design.colors.accent }}>{design.hero.highlight}</span>}
            </h1>}
            {design.hero.description && <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{design.hero.description}</p>}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {design.hero.primaryButton && <Link href="/shop" className="font-bold px-7 py-3 rounded-md text-sm transition-all flex items-center justify-center gap-2" style={{ backgroundColor: design.colors.accent, color: design.colors.primary }}>
                {design.hero.primaryButton} <ArrowRight className="w-4 h-4" />
              </Link>}
              {design.hero.secondaryButton && <Link href="/shop?category=Ihram" className="border font-semibold px-7 py-3 rounded-md text-sm transition-all text-center" style={{ borderColor: design.colors.accent, color: design.colors.accent }}>
                {design.hero.secondaryButton}
              </Link>}
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-4 border-gold-500/30 overflow-hidden shadow-2xl relative">
              <img
                src={mediaBySlot["hero-banner"] || "https://images.unsplash.com/photo-1590076175571-4b5459efb099?auto=format&fit=crop&q=80&w=800"}
                alt="Jannat Ihram Ghar Banner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Value Props */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {design.features.filter(feature => feature.title || feature.description).map((feature, index) => {
            const FeatureIcon = [Truck, ShieldCheck, RefreshCw, Award][index % 4] || Award;
            return <div key={index} className="flex flex-col items-center p-3">
              <FeatureIcon className="w-8 h-8 mb-2" style={{ color: design.colors.primary }} />
              <h4 className="font-bold text-sm text-gray-900">{feature.title}</h4>
              <p className="text-xs text-gray-500">{feature.description}</p>
            </div>;
          })}
        </div>
      </section>

      {/* Category Grid */}
      {design.sections.categories && <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: design.colors.primary }}>Browse Categories</h2>
        <p className="text-xs text-gray-500 text-center mb-8">Select a category to view specific products</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <Link
              key={index}
              href={`/shop?category=${encodeURIComponent(cat.slug)}`}
              className="group border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gold-500 transition-all text-center p-3 shadow-sm hover:shadow-md"
            >
              <div className="w-full aspect-square rounded-md overflow-hidden mb-2 bg-gray-100">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <h3 className="font-semibold text-xs text-emerald-900 group-hover:text-gold-600 line-clamp-1">{cat.title}</h3>
            </Link>
          ))}
        </div>
      </section>}

      {/* Featured Products */}
      {design.sections.featured && <section className="bg-emerald-50/50 py-12 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: design.colors.primary }}>Featured Products</h2>
              <p className="text-xs text-gray-600">Top selling items for Hajj, Umrah & daily Sunnah use</p>
            </div>
            <Link href="/shop" className="text-emerald-900 font-bold text-xs hover:text-gold-600 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>}
    </div>
  );
}