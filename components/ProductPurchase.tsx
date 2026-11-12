
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, Minus, Plus, ChevronDown } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string;
  variants?: {
    name: string;
    price: number | null;
  }[];
};

export default function ProductPurchase({
  product,
}: {
  product: Product;
}) {
  const { addToCart, setBuyNowItem } = useCart();
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.name ?? ''
  );

  const hasVariants = (product.variants?.length ?? 0) > 0;

  const variant = product.variants?.find(
    (v) => v.name === selectedVariant
  );

  const selectedPrice = variant
    ? (variant.price ?? product.price)
    : (product.salePrice ?? product.price);

  const canPurchase =
    product.stock > 0 && (!hasVariants || selectedVariant !== '');

  const selectedItem = {
    id: `${product.id}-${selectedVariant || 'default'}`,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    price: selectedPrice,
    image: product.image,
    variant: selectedVariant || undefined,
    quantity: qty,
  };

  const buyNow = () => {
    if (!canPurchase) return;
    setBuyNowItem(selectedItem);
    router.push('/checkout?buyNow=1');
  };

  return (
    <div className="space-y-6 text-[#F5F0E6]">

      {/* Variant Selector */}
      {hasVariants && (
        <div className="space-y-3">
          <label
            htmlFor="product-variant"
            className="block text-sm font-bold text-[#F3D27A] uppercase tracking-wide"
          >
            Select Variant
          </label>

          <div className="relative">
            <select
              id="product-variant"
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#C99A3B] bg-[#1B1B1B] text-[#FFF1C5] px-4 pr-12 py-3.5 text-sm font-medium outline-none focus:border-[#FFE08A] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all cursor-pointer"
            >
              <option value="" className="bg-[#1B1B1B] text-white">
                Choose a variant
              </option>

              {product.variants?.map((v) => (
                <option
                  key={v.name}
                  value={v.name}
                  className="bg-[#1B1B1B] text-[#FFF1C5]"
                >
                  {v.name} — PKR {(v.price ?? product.price).toLocaleString()} /-
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD76A]" />
          </div>

          {variant && (
            <div className="rounded-xl border border-[#9B722D]/40 bg-[#201A10] px-4 py-3">
              <p className="text-xs text-[#C8B58D] mb-1">
                Selected Variant Price
              </p>
              <p className="text-xl font-extrabold text-[#FFD76A]">
                PKR {selectedPrice.toLocaleString()} /-
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm font-semibold text-[#F3D27A]">
          Quantity
        </span>

        <div className="inline-flex items-center overflow-hidden rounded-xl border border-[#B88932] bg-[#171717]">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="p-3 text-[#FFD76A] hover:bg-[#302514] disabled:opacity-30 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="min-w-12 text-center text-sm font-bold text-white">
            {qty}
          </span>

          <button
            type="button"
            aria-label="Increase quantity"
            disabled={!canPurchase || qty >= product.stock}
            onClick={() =>
              setQty(Math.min(product.stock, qty + 1))
            }
            className="p-3 text-[#FFD76A] hover:bg-[#302514] disabled:opacity-30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <button
        type="button"
        disabled={!canPurchase}
        onClick={() => {
          if (!canPurchase) return;
          addToCart(selectedItem);
          alert('Added to cart');
        }}
        className="w-full rounded-xl bg-gradient-to-r from-[#C58A22] via-[#FFE08A] to-[#C58A22] text-[#17110A] font-extrabold py-4 px-5 flex items-center justify-center gap-3 shadow-[0_5px_25px_rgba(218,168,58,0.22)] hover:brightness-110 hover:shadow-[0_5px_30px_rgba(255,215,106,0.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ShoppingBag className="w-5 h-5" />
        Add to Cart
      </button>

      {/* Place Order */}
      <button
        type="button"
        disabled={!canPurchase}
        onClick={buyNow}
        className="w-full rounded-xl border-2 border-[#D4AF37] bg-[#141414] text-[#FFE08A] font-extrabold py-4 px-5 flex items-center justify-center gap-3 hover:bg-[#2A2114] hover:border-[#FFE08A] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Zap className="w-5 h-5" />
        Place Order
      </button>

      {hasVariants && !selectedVariant && product.stock > 0 && (
        <p className="text-sm text-[#F3D27A]">
          Please select a variant before ordering.
        </p>
      )}
    </div>
  );
}
