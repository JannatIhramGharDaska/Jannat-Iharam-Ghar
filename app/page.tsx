import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RefreshCw, Award, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { prisma } from '@/lib/prisma';
import { DEFAULT_SITE_DESIGN, normalizeSiteDesign } from '@/lib/site-design';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [savedDesign, savedCategories, featuredRows] = await Promise.all([
    prisma.siteDesign.findUnique({ where: { id: 'main' }, select: { published: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where: { featured: true, stock: { gt: 0 } },
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    }),
  ]);

  const design = normalizeSiteDesign(savedDesign?.published || DEFAULT_SITE_DESIGN);
  const featuredProducts = featuredRows.map(p => ({ ...p, categoryName: p.category.name }));
  const categories = savedCategories.map(c => ({
    title: c.name,
    slug: c.name,
    img: c.imageUrl || '/images/placeholder.svg',
  }));

  return (
    <main className="min-h-screen bg-[#080809] text-[#f8f4ea]">
      {/* Full-width luxury shop hero */}
      <section className="relative isolate flex min-h-[460px] items-center overflow-hidden border-b border-[#b88729]/50 sm:min-h-[620px] lg:min-h-[690px]">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-[60%_center] sm:bg-center lg:bg-[center_45%]"
          style={{ backgroundImage: "url('/images/luxury-shop-bg.jpg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(90deg, rgba(3,3,5,.98) 0%, rgba(4,4,6,.95) 25%, rgba(5,5,7,.77) 47%, rgba(6,6,8,.24) 75%, rgba(4,4,6,.36) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080809] to-transparent" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
          <div className="max-w-xl space-y-5 sm:space-y-7">
            {design.hero.badge && (
              <span className="inline-block rounded-full border border-[#d7a844]/70 bg-black/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#ffe29a] shadow-[0_0_20px_rgba(225,169,47,.12)] backdrop-blur-sm sm:px-4 sm:tracking-[.23em] sm:text-xs">
                {design.hero.badge}
              </span>
            )}

            {(design.hero.title || design.hero.highlight) && (
              <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight drop-shadow-[0_4px_15px_rgba(0,0,0,.7)] min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                <span className="text-[#fff8e8]">{design.hero.title}</span>{' '}
                {design.hero.highlight && (
                  <span className="bg-gradient-to-b from-[#fff7c6] via-[#ffd15c] to-[#b87a16] bg-clip-text text-transparent">
                    {design.hero.highlight}
                  </span>
                )}
              </h1>
            )}

            {design.hero.description && (
              <p className="max-w-lg text-sm leading-6 text-[#f2e9d8] drop-shadow-[0_2px_8px_rgba(0,0,0,.85)] sm:text-base sm:leading-7">
                {design.hero.description}
              </p>
            )}

            <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:flex-wrap sm:gap-4">
              {design.hero.primaryButton && (
                <Link
                  href="/shop"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#fff0b0] bg-gradient-to-br from-[#fff3af] via-[#f5c34d] to-[#b77b17] px-6 py-3 text-sm font-extrabold text-[#191107] shadow-[0_0_28px_rgba(241,181,52,.4)] transition-all hover:brightness-110 hover:shadow-[0_0_38px_rgba(255,203,73,.6)] sm:px-8 sm:py-3.5"
                >
                  {design.hero.primaryButton} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {design.hero.secondaryButton && (
                <Link
                  href="/shop?category=Ihram"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#e2b858] bg-black/60 px-6 py-3 text-sm font-semibold text-[#ffe4a0] backdrop-blur-sm transition-all hover:bg-[#2b2112] sm:px-8 sm:py-3.5"
                >
                  {design.hero.secondaryButton}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section className="border-b border-[#49371c] bg-[#101012] py-6 sm:py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-3 text-center sm:gap-4 sm:px-6 md:grid-cols-4">
          {design.features.filter(feature => feature.title || feature.description).map((feature, index) => {
            const FeatureIcon = [Truck, ShieldCheck, RefreshCw, Award][index % 4];
            return (
              <div key={index} className="flex flex-col items-center p-2 sm:p-3">
                <FeatureIcon className="mb-2 h-7 w-7 text-[#ffd56e] sm:mb-3 sm:h-8 sm:w-8" />
                <h3 className="text-xs font-bold text-[#fff4d8] sm:text-sm">{feature.title}</h3>
                <p className="mt-1 text-[11px] leading-5 text-[#bdb2a1] sm:text-xs">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      {design.sections.categories && (
        <section className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
          <h2 className="text-center text-xl font-bold text-[#ffe09a] sm:text-2xl">Browse Categories</h2>
          <p className="mb-6 mt-2 text-center text-xs text-[#bdb2a1] sm:mb-9">Select a category to view specific products</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
            {categories.map(cat => (
              <Link
                key={cat.title}
                href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                className="group min-w-0 overflow-hidden rounded-xl border border-[#6d5025] bg-[#171719] p-2 text-center shadow-lg transition-all hover:border-[#ffda76] hover:shadow-[0_0_24px_rgba(236,174,53,.15)] sm:p-3"
              >
                <div className="mb-2 aspect-square overflow-hidden rounded-md bg-[#252528] sm:mb-3">
                  <img src={cat.img} alt={cat.title} loading="lazy" decoding="async" width={320} height={320} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <h3 className="line-clamp-2 text-xs font-semibold text-[#f4e8cf] group-hover:text-[#ffd56e]">{cat.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {design.sections.featured && (
        <section className="border-y border-[#49371c] bg-[#101012] py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#ffe09a] sm:text-2xl">Featured Products</h2>
                <p className="mt-1 text-xs text-[#bdb2a1]">Top selling items for Hajj, Umrah & daily Sunnah use</p>
              </div>
              <Link href="/shop" className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#ffd56e] hover:text-white">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
              {featuredProducts.map(prod => <ProductCard key={prod.id} product={prod} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
