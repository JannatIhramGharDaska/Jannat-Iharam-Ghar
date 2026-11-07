import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { CartProvider } from '@/lib/cart-context';

export const metadata: Metadata = {
  title: 'Jannat Ihram Ghar | Premium Islamic & Umrah Essentials Pakistan',
  description: 'Buy premium Ihram towel sets, non-alcoholic Ittar, pure Sidr Honey, Sunnah Talbeena, Prayer Mats, and Abayas online with Cash on Delivery across Pakistan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen font-sans">
        <CartProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <FloatingWhatsApp />
        </CartProvider>
      </body>
    </html>
  );
}