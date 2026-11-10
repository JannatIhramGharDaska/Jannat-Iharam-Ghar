
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap } from 'lucide-react';
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
    <div className="space-y-4 pt-3">
      {hasVariants && (
        <div className="space-y-2">
          <label
            htmlFor="product-variant"
            className="block text-sm font-semibold"
          >
            Select Variant
          </label>

          <select
            id="product-variant"
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
          >
            <option value="">Choose a variant</option>

            {product.variants?.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} — PKR{' '}
                {(v.price ?? product.price).toLocaleString()}
              </option>
            ))}
          </select>

          {variant && (
            <p className="text-xl font-bold text-emerald-900">
              Selected Price: PKR {selectedPrice.toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">Quantity</span>

        <div className="flex border rounded">
          <button
            type="button"
            className="px-3 py-1"
            onClick={() => setQty(Math.max(1, qty - 1))}
          >
            −
          </button>

          <span className="px-4 py-1">{qty}</span>

          <button
            type="button"
            className="px-3 py-1"
            onClick={() =>
              setQty(Math.min(product.stock, qty + 1))
            }
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!canPurchase}
        onClick={() => {
          if (!canPurchase) return;
          addToCart(selectedItem);
          alert('Added to cart');
        }}
        className="w-full rounded bg-emerald-900 text-white font-bold py-3 flex items-center justify-center gap-2 disabled:bg-gray-300"
      >
        <ShoppingBag className="w-4 h-4" />
        Add to Cart
      </button>

      <button
        type="button"
        disabled={!canPurchase}
        onClick={buyNow}
        className="w-full rounded border border-emerald-900 text-emerald-900 font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Zap className="w-4 h-4" />
        Place Order
      </button>

      {hasVariants && !selectedVariant && product.stock > 0 && (
        <p className="text-sm text-gray-500">
          Please select a variant before ordering.
        </p>
      )}
    </div>
  );
}
