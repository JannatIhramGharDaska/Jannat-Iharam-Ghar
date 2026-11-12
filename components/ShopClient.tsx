'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard, { type ProductProps } from '@/components/ProductCard';

export default function ShopClient({ products }: { products: ProductProps[] }) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'All';
  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState(urlCategory);

  useEffect(() => {
    setSearch(urlSearch);
    setCategory(urlCategory);
  }, [urlSearch, urlCategory]);

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(new Set(products.map((p) => p.categoryName || 'Other'))),
    ],
    [products]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.categoryName === category;
      const searchableText = [product.name, product.sku, product.categoryName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [products, search, category]);

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-[#6d4d20]/50 bg-[#151515] p-3 sm:mb-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
        <label htmlFor="shop-search" className="sr-only">Search products</label>
        <input
          id="shop-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, SKU or category..."
          autoComplete="off"
          className="min-h-12 w-full min-w-0 rounded-lg border border-[#86632b] bg-[#0c0c0c] px-3 py-3 text-base text-[#fff5db] placeholder:text-[#998d77] outline-none focus:border-[#ffe08a] focus:ring-1 focus:ring-[#ffe08a] sm:text-sm"
        />
        <label htmlFor="shop-category" className="sr-only">Filter by category</label>
        <select
          id="shop-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-12 w-full min-w-0 rounded-lg border border-[#86632b] bg-[#0c0c0c] px-3 py-3 text-base text-[#fff5db] outline-none focus:border-[#ffe08a] focus:ring-1 focus:ring-[#ffe08a] sm:w-auto sm:max-w-64 sm:text-sm"
        >
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <p role="status" aria-live="polite" className="mb-5 text-sm text-[#c9b99b]">
        {filtered.length} products found
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 min-[390px]:gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#59401e] bg-[#141414] px-4 py-14 text-center sm:py-16">
          <p className="font-medium text-[#f5e4bd]">No matching products found.</p>
          <p className="mt-2 text-sm text-[#a99a7f]">Try a different product name or category.</p>
        </div>
      )}
    </>
  );
}
