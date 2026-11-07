'use client'

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export interface ProductProps {
  id: string;
  sku: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images: string;
  categoryName?: string;
  stock: number;
}

export default function ProductCard({ product }: { product: ProductProps }) {
  const { addToCart } = useCart();
  const imageList = JSON.parse(product.images || '["/images/placeholder.jpg"]');
  const primaryImage = imageList[0] || '/images/placeholder.jpg';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: `${product.id}-default`,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.salePrice || product.price,
      image: primaryImage,
      quantity: 1,
    });
    alert(`${product.name} added to your cart!`);
  };

  return (
    <div className="emerald-card rounded-lg overflow-hidden flex flex-col justify-between group">
      <div>
        <Link href={`/product/${product.id}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.salePrice && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              SALE
            </span>
          )}
          <span className="absolute top-2 right-2 bg-emerald-900/80 text-gold-400 text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
            SKU: {product.sku}
          </span>
        </Link>

        <div className="p-4">
          {product.categoryName && (
            <span className="text-[11px] text-gray-500 uppercase tracking-wider block mb-1">
              {product.categoryName}
            </span>
          )}
          <Link href={`/product/${product.id}`} className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-emerald-900 transition-colors">
            {product.name}
          </Link>
        </div>
      </div>

      <div className="p-4 pt-0">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-bold text-emerald-900">
            PKR {(product.salePrice || product.price).toLocaleString()}
          </span>
          {product.salePrice && (
            <span className="text-xs text-gray-400 line-through">
              PKR {product.price.toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={product.stock <= 0}
          className={`w-full py-2 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors ${
            product.stock > 0 
              ? 'bg-emerald-900 text-gold-400 hover:bg-emerald-950' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}