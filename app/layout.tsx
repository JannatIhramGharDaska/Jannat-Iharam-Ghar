import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';

export const metadata: Metadata = {
  title: {
    default: 'Jannat Ihram Ghar | Ihram, Abayas & Umrah Essentials Pakistan',
    template: '%s | Jannat Ihram Ghar',
  },
  description:
    'Shop Ihram towel sets, Abayas, non-alcoholic Ittar, Sidr Honey, Sunnah Talbeena and Prayer Mats at Jannat Ihram Ghar. Cash on Delivery across Pakistan.',
  applicationName: 'Jannat Ihram Ghar',
  keywords: [
    'Jannat Ihram Ghar',
    'Ihram Pakistan',
    'Umrah essentials Pakistan',
    'Hajj supplies Pakistan',
    'Abayas Pakistan',
    'Ittar Pakistan',
    'Prayer mats Pakistan',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Jannat Ihram Ghar',
    title: 'Jannat Ihram Ghar | Ihram, Abayas & Umrah Essentials',
    description:
      'Discover premium Ihram, Abayas, Ittar, Prayer Mats and other Islamic essentials with Cash on Delivery across Pakistan.',
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary',
    title: 'Jannat Ihram Ghar | Islamic & Umrah Essentials',
    description:
      'Shop Ihram, Abayas, Ittar, Prayer Mats and more across Pakistan.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
          <WishlistProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
            <FloatingWhatsApp />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
