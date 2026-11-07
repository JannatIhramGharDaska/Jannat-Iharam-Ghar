import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RefreshCw, Award, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const media = await prisma.mediaAsset.findMany();
  const mediaBySlot = Object.fromEntries(media.map(item => [item.slot, item.url]));
  const savedCategories = await prisma.category.findMany();
  // Mock data for initial presentation preview / DB fallback
  const featuredProducts = [
    { id: '1', sku: 'IHRAM-01', name: 'Premium Super Soft Cotton Ihram (1200g)', price: 3500, salePrice: 2999, stock: 25, images: '["https://images.unsplash.com/photo-1590076175571-4b5459efb099?auto=format&fit=crop&q=80&w=600"]', categoryName: 'Ihram' },
    { id: '2', sku: 'ITTAR-05', name: 'Royal White Musk Non-Alcoholic Fragrance (12ml)', price: 1800, salePrice: 1499, stock: 40, images: '["https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=600"]', categoryName: 'Ittar' },
    { id: '3', sku: 'HONEY-02', name: '100% Pure Organic Sidr Honey (500g)', price: 2800, salePrice: null, stock: 15, images: '["https://images.unsplash.com/photo-1587049352847-81a56d773cae?auto=format&fit=crop&q=80&w=600"]', categoryName: 'Honey' },
    { id: '4', sku: 'MAT-09', name: 'Orthopedic Soft Velvet Janamaz Prayer Mat', price: 2400, salePrice: 1999, stock: 18, images: '["https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600"]', categoryName: 'Prayer Mats' },
  ];

  const categories = [
    { title: "Ihram & Umrah", slug: "Ihram", img: savedCategories.find(c => c.slug === "ihram")?.imageUrl || "https://images.unsplash.com/photo-1590076175571-4b5459efb099?auto=format&fit=crop&q=80&w=300" },
    { title: "Pure Ittar & Perfumes", slug: "Ittar", img: savedCategories.find(c => c.slug === "ittar")?.imageUrl || "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=300" },
    { title: "Sidr Honey & Talbeena", slug: "Honey", img: savedCategories.find(c => c.slug === "honey")?.imageUrl || "https://images.unsplash.com/photo-1587049352847-81a56d773cae?auto=format&fit=crop&q=80&w=300" },
    { title: "Jaye Namaz / Mats", slug: "Prayer Mats", img: savedCategories.find(c => c.slug === "prayer-mats")?.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=300" },
    { title: "Abayas & Stoles", slug: "Abayas", img: savedCategories.find(c => c.slug === "abayas")?.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300" },
    { title: "Islamic Caps & Accessories", slug: "Islamic Caps", img: savedCategories.find(c => c.slug === "islamic-caps")?.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300" },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-emerald-950 text-white overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 text-center md:text-left">
            <span className="inline-block bg-emerald-900 border border-gold-500/40 text-gold-400 text-xs px-3.5 py-1 rounded-full font-semibold uppercase tracking-widest">
              Bismillah-ir-Rahman-ir-Rahim
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Premium Islamic Essentials & Complete <span className="text-gold-400">Umrah Supplies</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Order original towel Ihrams, non-alcoholic Arabic fragrance oils, organic Sidr honey, and high-density Janamaz with cash on delivery across Pakistan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/shop" className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold px-7 py-3 rounded-md text-sm transition-all flex items-center justify-center gap-2">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/shop?category=Ihram" className="border border-gold-500 text-gold-400 hover:bg-emerald-900 font-semibold px-7 py-3 rounded-md text-sm transition-all text-center">
                View Ihram Collection
              </Link>
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
          <div className="flex flex-col items-center p-3">
            <Truck className="w-8 h-8 text-emerald-900 mb-2" />
            <h4 className="font-bold text-sm text-gray-900">Cash on Delivery</h4>
            <p className="text-xs text-gray-500">Delivered across all Pakistan</p>
          </div>
          <div className="flex flex-col items-center p-3">
            <ShieldCheck className="w-8 h-8 text-emerald-900 mb-2" />
            <h4 className="font-bold text-sm text-gray-900">100% Original Guarantee</h4>
            <p className="text-xs text-gray-500">Authentic Sunnah products</p>
          </div>
          <div className="flex flex-col items-center p-3">
            <RefreshCw className="w-8 h-8 text-emerald-900 mb-2" />
            <h4 className="font-bold text-sm text-gray-900">Easy Exchange</h4>
            <p className="text-xs text-gray-500">7 Days Hassle-free Policy</p>
          </div>
          <div className="flex flex-col items-center p-3">
            <Award className="w-8 h-8 text-emerald-900 mb-2" />
            <h4 className="font-bold text-sm text-gray-900">Best Quality & Rates</h4>
            <p className="text-xs text-gray-500">Direct physical store prices</p>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-emerald-950 mb-2 text-center">Browse Categories</h2>
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
      </section>

      {/* Featured Products */}
      <section className="bg-emerald-50/50 py-12 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-emerald-950">Featured Products</h2>
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
      </section>
    </div>
  );
}