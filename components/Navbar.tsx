'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export default function Navbar() {
  const { cart } = useCart();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteLogo, setSiteLogo] = useState('');
  useEffect(() => { fetch('/api/media').then(r => r.json()).then(d => setSiteLogo(d.assets?.find((a: {slot:string;url:string}) => a.slot === 'site-logo')?.url || '')).catch(() => {}); }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = [
    "Perfumes", "Ittar", "Honey", "Talbeena", "Islamic Caps", 
    "Ihram", "Umrah Accessories", "Abayas", "Stoles / Scarves", "Prayer Mats"
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-900 flex items-center justify-center text-gold-500 font-bold text-xl border-2 border-gold-500">
            {siteLogo ? <img src={siteLogo} alt="Jannat Ihram Ghar logo" className="w-full h-full object-contain" /> : 'ج'}
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-emerald-900 block leading-tight">
              JANNAT IHRAM GHAR
            </span>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase font-semibold block">
              Islamic & Umrah Store
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); if(searchQuery) window.location.href=`/shop?search=${encodeURIComponent(searchQuery)}`; }}
          className="hidden md:flex flex-1 max-w-md relative"
        >
          <input
            type="text"
            placeholder="Search Ihram, Ittar, Honey, Prayer Mats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-emerald-900"
          />
          <button type="submit" className="absolute right-3 top-2.5 text-gray-500 hover:text-emerald-900">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative flex items-center gap-1 text-emerald-900 hover:text-gold-600">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gold-500 text-emerald-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
            <span className="hidden lg:inline text-sm font-semibold ml-1">Cart</span>
          </Link>

          <button 
            onClick={() => setMobileMenu(!mobileMenu)} 
            className="md:hidden text-emerald-900 p-1"
          >
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Category Navigation Bar */}
      <nav className="hidden md:block bg-emerald-950 border-t border-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs font-medium overflow-x-auto py-2.5">
          <Link href="/shop" className="hover:text-gold-400 transition-colors uppercase font-bold text-gold-400">All Products</Link>
          {categories.map((cat, i) => (
            <Link key={i} href={`/shop?category=${encodeURIComponent(cat)}`} className="hover:text-gold-400 whitespace-nowrap transition-colors">
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 pt-3 pb-6">
          <form 
            onSubmit={(e) => { e.preventDefault(); if(searchQuery) window.location.href=`/shop?search=${encodeURIComponent(searchQuery)}`; }}
            className="mb-4 relative"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-gray-500">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col space-y-2 text-sm">
            <Link href="/shop" className="font-bold text-emerald-900 py-1 border-b">View All Shop</Link>
            {categories.map((cat, idx) => (
              <Link 
                key={idx} 
                href={`/shop?category=${encodeURIComponent(cat)}`}
                onClick={() => setMobileMenu(false)}
                className="py-1 text-gray-700 hover:text-emerald-900"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}