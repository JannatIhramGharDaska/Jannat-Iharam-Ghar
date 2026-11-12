import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-gray-300 pt-12 pb-6 border-t-4 border-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
        {/* Col 1 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-900 rounded-full flex items-center justify-center text-gold-400 font-bold border border-gold-500">ج</div>
            <span className="text-lg font-bold text-white tracking-wide">JANNAT IHRAM GHAR</span>
          </div>
          <p className="text-gray-400 leading-relaxed text-xs mb-4">
            Your trusted store for high-quality Ihram, authentic Arabic fragrances, pure Siddr Honey, Talbeena, and premium Umrah essentials across Pakistan.
          </p>
          <div className="text-xs text-gold-400 font-medium">📍 Main Physical Store Open in Pakistan</div>
        </div>

        {/* Col 2 */}
        <div>
          <h3 className="text-white font-semibold mb-3 border-b border-emerald-800 pb-1 text-base">Quick Links</h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/shop" className="hover:text-gold-400">All Products</Link></li>
            <li><Link href="/shop?category=Ihram" className="hover:text-gold-400">Ihram Collection</Link></li>
            <li><Link href="/shop?category=Ittar" className="hover:text-gold-400">Pure Non-Alcoholic Ittar</Link></li>
            <li><Link href="/shop?category=Honey" className="hover:text-gold-400">Natural Organic Honey</Link></li>
            <li><Link href="/shop?category=Talbeena" className="hover:text-gold-400">Sunnah Talbeena</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h3 className="text-white font-semibold mb-3 border-b border-emerald-800 pb-1 text-base">Customer Policies</h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="#" className="hover:text-gold-400">Cash on Delivery Info</Link></li>
            <li><Link href="#" className="hover:text-gold-400">7-Day Easy Return & Refund</Link></li>
            <li><Link href="#" className="hover:text-gold-400">Shipping Rates (Across Pakistan)</Link></li>
            <li><Link href="#" className="hover:text-gold-400">Track Order Status</Link></li>
            <li><Link href="/admin/login" className="hover:text-gold-400 text-gray-500">Store Admin Login</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h3 className="text-white font-semibold mb-3 border-b border-emerald-800 pb-1 text-base">Contact Us</h3>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <span>Jannat Ihram Ghar, Gali Darziyon Wali, Machli Bazar, Daska</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold-400 shrink-0" />
              <span>+92 345 1840478</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold-400 shrink-0" />
              <span>jannatihramghar@gmail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400 shrink-0" />
              <span>Online Orders: 24/7</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-emerald-900 pt-4 text-center text-xs text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© {new Date().getFullYear()} Jannat Ihram Ghar. All Rights Reserved.</p>
        <p className="text-gray-400">Online Orders Open 24/7 | Cash on Delivery Available</p>
      </div>
    </footer>
  );
}