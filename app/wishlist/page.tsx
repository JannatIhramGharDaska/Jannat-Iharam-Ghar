
'use client';

import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/lib/wishlist-context';

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <main className="min-h-[65vh] bg-[#080809] px-4 py-12 text-[#f8f4ea]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex items-center gap-3">
          <Heart className="h-7 w-7 text-[#ffd56e]" />

          <div>
            <h1 className="text-3xl font-bold text-[#ffe09a]">
              My Wishlist
            </h1>
            <p className="mt-1 text-sm text-[#bdb2a1]">
              {wishlist.length} saved{' '}
              {wishlist.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#62471e] bg-[#171717] px-6 py-16 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-[#b99b5d]" />

            <h2 className="text-xl font-bold text-[#ffe09a]">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-sm text-[#bdb2a1]">
              Tap the heart on a product to save it here.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#b67a19] via-[#ffe38c] to-[#d29b32] px-6 py-3 text-sm font-bold text-[#171006]"
            >
              <ArrowLeft className="h-4 w-4" />
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
