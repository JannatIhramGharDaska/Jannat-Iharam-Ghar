
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Truck,
  ShieldCheck,
  Phone,
  Heart,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';

export default function Navbar() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteLogo, setSiteLogo] = useState('');

  useEffect(() => {
    fetch('/api/media')
      .then((r) => r.json())
      .then((d) =>
        setSiteLogo(
          d.assets?.find(
            (a: { slot: string; url: string }) =>
              a.slot === 'site-logo'
          )?.url || ''
        )
      )
      .catch(() => {});
  }, []);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const categories = [
    'Perfumes',
    'Ittar',
    'Honey',
    'Talbeena',
    'Islamic Caps',
    'Ihram',
    'Umrah Accessories',
    'Abayas',
    'Stoles / Scarves',
    'Prayer Mats',
  ];

  const submitSearch = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (query) {
      setMobileMenu(false);
      window.location.href =
        `/shop?search=${encodeURIComponent(query)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#080808] text-white border-b border-[#C99730]/50 shadow-[0_8px_35px_rgba(0,0,0,0.65)]">

      {/* Premium Gold Top Bar */}
      <div className="hidden sm:block bg-[#101010] border-b border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-[10px] lg:text-xs text-[#F5D77D]">
          <span className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            Helpline: 0345-1840478
          </span>

          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Delivery All Over Pakistan
          </span>

          <span className="hidden md:flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Premium Islamic Essentials
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 lg:gap-8">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0 shrink-0"
        >
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-[#111111] border border-[#E9BF55] shadow-[0_0_15px_rgba(255,199,73,0.2)] flex items-center justify-center">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Jannat Ihram Ghar logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[#FFD76A] font-bold text-2xl">
                ج
              </span>
            )}
          </div>

          <div className="min-w-0">
            <span className="block text-sm sm:text-lg lg:text-xl font-bold tracking-wide leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#C58A22] via-[#FFF1AD] to-[#DCA63E]">
              JANNAT IHRAM GHAR
            </span>

            <span className="block text-[9px] sm:text-[10px] text-[#C9B782] uppercase tracking-[0.18em] mt-1">
              Islamic & Umrah Store
            </span>
          </div>
        </Link>

        {/* Desktop Search */}
        <form
          onSubmit={submitSearch}
          className="hidden md:flex flex-1 max-w-lg relative"
        >
          <input
            type="search"
            placeholder="Search Ihram, Ittar, Honey, Abayas..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            className="w-full bg-[#171717] text-white placeholder:text-[#999999] border border-[#C99A3B] rounded-full pl-5 pr-12 py-3 text-sm outline-none focus:border-[#FFE08A] focus:shadow-[0_0_18px_rgba(255,208,94,0.18)] transition-all"
          />

          <button
            type="submit"
            aria-label="Search products"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFD76A] hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {/* Wishlist + Cart + Mobile Menu */}
        <div className="flex items-center gap-4">

          {/* Wishlist */}
          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishlist.length} saved products`}
            className="relative flex items-center gap-2 text-[#F3D27A] hover:text-white transition-colors"
          >
            <Heart className="w-6 h-6" />

            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-gradient-to-br from-[#FFF2A7] via-[#E8B747] to-[#B97A13] text-black text-[11px] font-extrabold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}

            <span className="hidden lg:inline text-sm font-semibold">
              Wishlist
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 text-[#F3D27A] hover:text-white transition-colors"
          >
            <ShoppingBag className="w-6 h-6" />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-gradient-to-br from-[#FFF2A7] via-[#E8B747] to-[#B97A13] text-black text-[11px] font-extrabold flex items-center justify-center">
                {cartCount}
              </span>
            )}

            <span className="hidden lg:inline text-sm font-semibold">
              Cart
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() =>
              setMobileMenu(!mobileMenu)
            }
            aria-label={
              mobileMenu ? 'Close menu' : 'Open menu'
            }
            aria-expanded={mobileMenu}
            className="md:hidden text-[#FFD76A] p-1"
          >
            {mobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Categories */}
      <nav className="hidden md:block bg-[#111111] border-t border-[#C99730]/40">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-7 overflow-x-auto py-3 text-xs font-semibold whitespace-nowrap">
          <Link
            href="/shop"
            className="text-[#FFE08A] hover:text-white uppercase tracking-wide transition-colors"
          >
            All Products
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/shop?category=${encodeURIComponent(cat)}`}
              className="text-[#D4C6A4] hover:text-[#FFD76A] transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenu && (
        <div className="md:hidden bg-[#101010] border-t border-[#D4AF37]/40 px-4 pt-4 pb-6 max-h-[75vh] overflow-y-auto">

          <form
            onSubmit={submitSearch}
            className="relative mb-5"
          >
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="w-full bg-[#1B1B1B] text-white placeholder:text-gray-400 border border-[#C99A3B] rounded-lg pl-4 pr-11 py-3 text-sm outline-none focus:border-[#FFE08A]"
            />

            <button
              type="submit"
              aria-label="Search products"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFD76A]"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          <div className="flex flex-col text-sm">
            <Link
              href="/shop"
              onClick={() =>
                setMobileMenu(false)
              }
              className="font-bold text-[#FFE08A] py-3 border-b border-[#333333]"
            >
              All Products
            </Link>

            <Link
              href="/wishlist"
              onClick={() =>
                setMobileMenu(false)
              }
              className="py-3 border-b border-[#292929] text-[#FFE08A]"
            >
              ♡ My Wishlist ({wishlist.length})
            </Link>

            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/shop?category=${encodeURIComponent(cat)}`}
                onClick={() =>
                  setMobileMenu(false)
                }
                className="py-3 border-b border-[#292929] text-[#E2D6BB] hover:text-[#FFD76A]"
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
