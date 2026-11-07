import React from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';

export default function FloatingWhatsApp() {
  const defaultText = encodeURIComponent("Assalam-o-Alaikum! I want to inquire about your products at Jannat Ihram Ghar.");
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${defaultText}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:bg-green-600 transition-all transform hover:scale-105"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 fill-current" />
      <span className="hidden sm:inline font-semibold text-sm pr-1">WhatsApp Us</span>
    </a>
  );
}