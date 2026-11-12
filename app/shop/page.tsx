import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ShopClient from '@/components/ShopClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop Islamic Essentials, Ihram & Umrah Supplies | Jannat Ihram Ghar',
  description:
    'Explore Ihram, abayas and Islamic essentials at Jannat Ihram Ghar. Browse our collection of products for Hajj, Umrah and everyday use.',
  robots: { index: true, follow: true },
};

export default async function ShopPage() {
  const [rows, ratings] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.groupBy({
      by: ['productId'],
      where: { status: 'Approved' },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const ratingMap = new Map(
    ratings.map((r) => [
      r.productId,
      {
        averageRating: r._avg.rating ?? 0,
        reviewCount: r._count.rating,
      },
    ])
  );

  const products = rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.stock,
    images: p.images,
    categoryName: p.category.name,
    averageRating: ratingMap.get(p.id)?.averageRating ?? 0,
    reviewCount: ratingMap.get(p.id)?.reviewCount ?? 0,
  }));

  return (
    <main className="min-h-screen bg-[#090909] text-[#f8f1df]">
      <div className="border-b border-[#73511e]/50 bg-[radial-gradient(ellipse_at_top_right,_#3b2812_0%,_#111111_50%,_#090909_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-16">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f7cf69] sm:text-xs sm:tracking-[0.3em]">
            Jannat Ihram Ghar Collection
          </p>
          <h1 className="bg-gradient-to-r from-[#c58a22] via-[#fff1ad] to-[#dca63e] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Our Products
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#cfc3ab] sm:text-base">
            Islamic essentials and complete Umrah supplies
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-3 py-7 sm:px-6 sm:py-10">
        <ShopClient products={products} />
      </div>
    </main>
  );
}
