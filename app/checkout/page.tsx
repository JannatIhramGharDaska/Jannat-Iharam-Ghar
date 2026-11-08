'use client'

import React, { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatWhatsAppMessage } from '@/lib/whatsapp';
import { CheckCircle2, Truck } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, cartSubtotal, deliveryFee, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    city: 'Lahore',
    orderNotes: '',
    paymentMethod: 'Cash on Delivery (COD)',
  });

  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const pakistaniCities = [
    "Abbottabad","Ahmadpur East","Arifwala","Attock","Badin","Bahawalnagar","Bahawalpur","Bannu","Bhalwal","Bhakkar","Burewala","Chakwal","Charsadda","Chiniot","Daska","Dera Ghazi Khan","Dera Ismail Khan","Faisalabad","Ferozewala","Ghotki","Gojra","Gujranwala","Gujrat","Gwadar","Hafizabad","Haripur","Hyderabad","Islamabad","Jacobabad","Jaranwala","Jhang","Jhelum","Kamoke","Karachi","Kasur","Khairpur","Khanewal","Khanpur","Kohat","Kot Addu","Lahore","Larkana","Mandi Bahauddin","Mardan","Mingora","Mirpur AJK","Multan","Murree","Muzaffargarh","Nawabshah","Nowshera","Okara","Pakpattan","Peshawar","Quetta","Rahim Yar Khan","Rawalpindi","Sahiwal","Sargodha","Sheikhupura","Shikarpur","Sialkot","Sukkur","Swabi","Tando Adam","Tando Allahyar","Taxila","Thatta","Timergara","Toba Tek Singh","Vehari","Wah Cantt","Other"
  ];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");

    setSubmitting(true);

    const generatedOrderNumber = `JIG-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderPayload = {
      orderNumber: generatedOrderNumber,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      deliveryAddress: formData.deliveryAddress,
      city: formData.city,
      orderNotes: formData.orderNotes,
      paymentMethod: formData.paymentMethod,
      subtotal: cartSubtotal,
      deliveryFee: deliveryFee,
      total: cartTotal,
      items: cart,
    };

    try {
      // POST to backend API route
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Order could not be placed.');
      const confirmed = { ...orderPayload, orderNumber: result.orderNumber, total: result.total, items: result.items };
      setCompletedOrder(confirmed);
      clearCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Order could not be placed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    const waUrl = formatWhatsAppMessage(completedOrder);

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-900 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-950 mb-2">JazakAllah! Order Placed Successfully</h1>
          <p className="text-sm text-gray-600 mb-4">
            Your Order ID is <strong className="text-emerald-900">{completedOrder.orderNumber}</strong>.
          </p>
          <div className="bg-white p-4 rounded-lg border text-left text-xs space-y-2 mb-6">
            <p><strong>Name:</strong> {completedOrder.customerName}</p>
            <p><strong>Phone:</strong> {completedOrder.customerPhone}</p>
            <p><strong>Address:</strong> {completedOrder.deliveryAddress}, {completedOrder.city}</p>
            <p><strong>Payment:</strong> {completedOrder.paymentMethod}</p>
            <p><strong>Total Payable:</strong> PKR {completedOrder.total.toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md text-sm transition-colors"
            >
              📲 Send Order Confirmation via WhatsApp
            </a>
            <a href="/" className="block text-xs text-emerald-900 font-bold hover:underline">
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-emerald-950 mb-6">Checkout & Delivery Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmitOrder} className="lg:col-span-2 bg-white p-6 border border-gray-200 rounded-lg space-y-4">
          <h2 className="font-bold text-emerald-900 text-base mb-2">Shipping Information</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammad Ali"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-emerald-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number (WhatsApp) *</label>
              <input
                type="tel"
                required
                placeholder="03001234567"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-emerald-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
              <input list="pakistani-cities" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Type to search your city" className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-emerald-900" />
              <datalist id="pakistani-cities">{pakistaniCities.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Complete Street / House Address *</label>
            <textarea
              required
              rows={3}
              placeholder="House #, Street #, Sector/Mohallah..."
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-emerald-900"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Order Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Deliver before 5 PM"
              value={formData.orderNotes}
              onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-emerald-900"
            />
          </div>

          <div className="pt-4 border-t">
            <label className="font-bold text-xs text-gray-700 block mb-2">Payment Method</label>
            <select value={formData.paymentMethod} onChange={e=>setFormData({...formData,paymentMethod:e.target.value})} className="w-full border rounded p-3 text-sm">
              <option>Cash on Delivery (COD)</option><option>JazzCash (Manual Transfer)</option><option>Easypaisa (Manual Transfer)</option><option>Bank Transfer</option>
            </select>
            {formData.paymentMethod !== 'Cash on Delivery (COD)' && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mt-2">Online/manual transfer selected. Store payment details will be confirmed with you by phone or WhatsApp before order processing. Do not send payment until verified.</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-900 hover:bg-emerald-950 text-gold-400 font-bold py-3.5 rounded-md text-sm transition-colors mt-4"
          >
            {submitting ? 'Processing Order...' : 'Place Order'}
          </button>
        </form>

        {/* Sidebar Summary */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg h-fit space-y-4">
          <h2 className="font-bold text-emerald-950 border-b pb-2 text-base">Your Order ({cart.length} items)</h2>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <div>
                  <span className="font-semibold text-gray-900">{item.name}</span>
                  <span className="block text-gray-500">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-emerald-900">PKR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-bold">PKR {cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-bold">PKR {deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-emerald-900 border-t pt-2 mt-2">
              <span>Total</span>
              <span>PKR {cartTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}