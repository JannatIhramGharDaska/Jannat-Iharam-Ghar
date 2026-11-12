
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingCart,
  ShoppingBag,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    deliveryFee,
    cartTotal,
  } = useCart();

  if (cart.length === 0) {
    return (
      <main className="min-h-[75vh] bg-[#080808] px-4 py-20 text-center flex flex-col items-center justify-center">
        <div className="w-28 h-28 rounded-full border border-[#B88932]/40 bg-[#19150E] flex items-center justify-center mb-7">
          <ShoppingCart className="w-12 h-12 text-[#FFD76A]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#E9BA49] to-[#C58A22] mb-4">
          Your Shopping Cart is Empty
        </h1>

        <p className="text-[#BDB4A5] text-sm mb-8 max-w-md">
          Looks like you haven&apos;t added any products to your cart yet.
          Explore our collection and find something special.
        </p>

        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C58A22] via-[#FFE08A] to-[#C58A22] px-8 py-4 text-sm font-extrabold text-[#17110A] hover:brightness-110 transition-all"
        >
          <ShoppingBag className="w-5 h-5" />
          Explore Products Now
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F0E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="mb-9">
          <p className="text-[#D9B65F] text-xs font-semibold tracking-[0.2em] uppercase mb-2">
            Jannat Ihram Ghar
          </p>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#E9BA49] to-[#C58A22]">
            Shopping Cart
          </h1>

          <p className="text-sm text-[#AFA79A] mt-3">
            Your selected products will be placed together as one order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#F3D27A]">
                Your Products
              </h2>

              <span className="rounded-full border border-[#B88932]/40 bg-[#1B1710] px-4 py-1.5 text-xs font-semibold text-[#FFD76A]">
                {cart.reduce((total, item) => total + item.quantity, 0)} Items
              </span>
            </div>

            {cart.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#795C30]/50 bg-[#151515] p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
              >
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="shrink-0 rounded-xl overflow-hidden border border-[#9C793D]/40 bg-[#242424]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-24 sm:w-24 sm:h-28 object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-[#F8E8C1] break-words">
                      {item.name}
                    </h3>

                    <p className="text-xs text-[#A99E8C] mt-2">
                      SKU: {item.sku}
                    </p>

                    {item.variant && (
                      <span className="inline-block mt-2 rounded-md border border-[#B88932]/40 bg-[#231D12] px-2.5 py-1 text-xs text-[#EFD28C]">
                        {item.variant}
                      </span>
                    )}

                    <p className="text-base sm:text-lg font-extrabold text-[#FFD76A] mt-3">
                      PKR {item.price.toLocaleString()} /-
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name}`}
                    title="Remove product"
                    className="shrink-0 rounded-lg border border-[#6D3535]/50 bg-[#2B1717] p-2.5 text-[#FF9999] hover:bg-[#4A2020] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity and Item Total */}
                <div className="mt-5 pt-4 border-t border-[#5A482D]/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#C4B9A5]">
                      Quantity
                    </span>

                    <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#B88932]/60 bg-[#1A1A1A]">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2.5 text-[#FFD76A] hover:bg-[#302514] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="min-w-9 text-center text-sm font-bold text-white">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2.5 text-[#FFD76A] hover:bg-[#302514] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-[#A99E8C]">
                      Item Total
                    </p>

                    <p className="text-sm sm:text-base font-extrabold text-[#FFD76A]">
                      PKR {(item.price * item.quantity).toLocaleString()} /-
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#F3D27A] hover:text-white transition-colors mt-3"
            >
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div>
            <div className="lg:sticky lg:top-28 rounded-2xl border border-[#B88932]/50 bg-[#151515] p-5 sm:p-7 space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3 pb-5 border-b border-[#B88932]/35">
                <ShoppingBag className="w-6 h-6 text-[#FFD76A]" />

                <h2 className="text-xl font-bold text-[#F3D27A]">
                  Order Summary
                </h2>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[#BFB5A5]">
                  Subtotal
                </span>

                <span className="font-semibold text-[#F5F0E6]">
                  PKR {cartSubtotal.toLocaleString()} /-
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[#BFB5A5]">
                  Delivery Charges
                  <span className="block text-[11px] text-[#8F877B] mt-1">
                    Across Pakistan
                  </span>
                </span>

                <span className="font-semibold text-[#F5F0E6]">
                  PKR {deliveryFee.toLocaleString()} /-
                </span>
              </div>

              <div className="border-t border-[#B88932]/40 pt-5 flex items-center justify-between gap-3">
                <span className="font-bold text-[#F5E5BE]">
                  Total Amount
                </span>

                <span className="text-xl sm:text-2xl font-extrabold text-[#FFD76A]">
                  PKR {cartTotal.toLocaleString()} /-
                </span>
              </div>

              <p className="text-[11px] text-[#AFA79A] text-center leading-relaxed">
                Choose Cash on Delivery, JazzCash, Easypaisa
                or Bank Transfer at checkout.
              </p>

              <Link
                href="/checkout"
                className="w-full rounded-xl bg-gradient-to-r from-[#C58A22] via-[#FFE08A] to-[#C58A22] text-[#17110A] font-extrabold py-4 px-4 flex items-center justify-center gap-2 text-sm hover:brightness-110 transition-all shadow-[0_5px_25px_rgba(218,168,58,0.2)]"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#5A482D]/50">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="w-6 h-6 text-[#FFD76A]" />
                  <span className="text-[11px] text-[#BDB4A5]">
                    Pakistan-Wide Delivery
                  </span>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-[#FFD76A]" />
                  <span className="text-[11px] text-[#BDB4A5]">
                    Secure Checkout
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
