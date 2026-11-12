
'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist-context';

export interface ProductProps {
  id: string;
  sku: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images: string;
  categoryName?: string;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
}

export default function ProductCard({
  product,
}: {
  product: ProductProps;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();

  let imageList: string[] = [];

  try {
    const parsed = JSON.parse(product.images || '[]');
    imageList = Array.isArray(parsed) ? parsed : [];
  } catch {
    imageList = [];
  }

  const primaryImage =
    imageList[0] || '/images/placeholder.jpg';

  const hasSale =
    product.salePrice != null &&
    product.salePrice < product.price;

  const hasReviews = (product.reviewCount ?? 0) > 0;

  const rating = Math.max(
    0,
    Math.min(5, product.averageRating ?? 0)
  );

  const saved = isWishlisted(product.id);

  return (
    <div className="rounded-xl overflow-hidden flex flex-col justify-between group bg-[#171717] border border-[#62471e] hover:border-[#f0c65f] hover:shadow-[0_8px_32px_rgba(224,171,59,0.16)] transition-all duration-300">
      <div>
        <div className="relative">
          <Link
            href={`/product/${product.id}`}
            className="block relative aspect-square bg-[#252525] overflow-hidden"
          >
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {hasSale && (
              <span className="absolute top-2 left-2 bg-[#b91c1c] text-white text-[10px] font-bold px-2 py-1 rounded">
                SALE
              </span>
            )}

            <span className="absolute bottom-2 right-2 bg-black/85 text-[#ffdb7c] text-[10px] font-semibold px-2 py-1 rounded backdrop-blur-sm">
              SKU: {product.sku}
            </span>
          </Link>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-label={
              saved
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={saved}
            title={
              saved
                ? 'Remove from Wishlist'
                : 'Add to Wishlist'
            }
            className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#c99a3b] bg-[#111]/90 text-[#ffda76] shadow-lg transition hover:scale-105 hover:bg-[#30230e]"
          >
            <Heart
              className="h-5 w-5"
              fill={saved ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        <div className="p-3 sm:p-4 pb-2">
          {product.categoryName && (
            <span className="text-[10px] sm:text-[11px] text-[#b4a58a] uppercase tracking-wider block mb-1">
              {product.categoryName}
            </span>
          )}

          <Link
            href={`/product/${product.id}`}
            className="font-semibold text-[#fff4df] text-xs sm:text-sm line-clamp-2 hover:text-[#ffdc82] transition-colors"
          >
            {product.name}
          </Link>

          <div
            className="mt-2 flex items-center gap-1.5"
            aria-label={
              hasReviews
                ? `Rated ${rating.toFixed(1)} out of 5 from ${product.reviewCount} reviews`
                : 'No reviews yet'
            }
          >
            {hasReviews ? (
              <>
                <span
                  className="flex items-center text-sm tracking-[-1px]"
                  aria-hidden="true"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={
                        i < Math.round(rating)
                          ? 'text-[#ffd35a]'
                          : 'text-[#655638]'
                      }
                    >
                      ★
                    </span>
                  ))}
                </span>

                <span className="text-[11px] text-[#e7d1a0]">
                  {rating.toFixed(1)}
                </span>

                <span className="text-[11px] text-[#a99b84]">
                  ({product.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-[11px] text-[#aa9b83]">
                ☆ No reviews yet
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 pt-1">
        <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mb-3">
          <span className="text-sm sm:text-base font-bold text-[#ffdb7c]">
            PKR{' '}
            {(hasSale
              ? product.salePrice!
              : product.price
            ).toLocaleString()} /-
          </span>

          {hasSale && (
            <span className="text-[11px] text-[#a89c8a] line-through">
              PKR {product.price.toLocaleString()} /-
            </span>
          )}
        </div>

        <Link
          href={`/product/${product.id}`}
          className="w-full py-2.5 px-2 rounded-md font-bold text-xs flex items-center justify-center bg-gradient-to-r from-[#b67a19] via-[#ffe38c] to-[#d29b32] text-[#171006] hover:brightness-110 transition-all"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
}
