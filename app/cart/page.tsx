'use client'

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartSubtotal, deliveryFee, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-16 h-16 text-emerald-900/30 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-emerald-950 mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-gray-500 text-sm mb-6">Looks like you haven't added any products to your cart yet.</p>
        <Link href="/shop" className="bg-emerald-900 text-gold-400 font-bold px-6 py-3 rounded-md text-sm hover:bg-emerald-950 transition-colors inline-block">
          Explore Products Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-emerald-950 mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white p-4 border border-gray-200 rounded-lg flex items-center justify-between gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded border" />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
                <p className="text-xs text-gray-500">SKU: {item.sku} {item.variant ? `| ${item.variant}` : ''}</p>
                <p className="text-sm font-bold text-emerald-900 mt-1">PKR {item.price.toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-2 border rounded-md p-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold px-2">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg h-fit space-y-4">
          <h2 className="font-bold text-emerald-950 border-b pb-2 text-base">Order Summary</h2>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold text-gray-900">PKR {cartSubtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Charges (Across Pakistan)</span>
            <span className="font-semibold text-gray-900">PKR {deliveryFee.toLocaleString()}</span>
          </div>

          <div className="border-t pt-3 flex justify-between text-base font-bold text-emerald-950">
            <span>Total Amount</span>
            <span>PKR {cartTotal.toLocaleString()}</span>
          </div>

          <p className="text-[11px] text-gray-500 text-center">Payment Method: Cash on Delivery (COD)</p>

          <Link href="/checkout" className="w-full bg-emerald-900 hover:bg-emerald-950 text-gold-400 font-bold py-3 rounded-md text-sm transition-colors flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}