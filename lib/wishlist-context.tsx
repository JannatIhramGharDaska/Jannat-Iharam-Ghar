
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface WishlistProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images: string;
  categoryName?: string;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
}

interface WishlistContextType {
  wishlist: WishlistProduct[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (product: WishlistProduct) => void;
  removeFromWishlist: (id: string) => void;
}

const WishlistContext =
  createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'jannat-ihram-ghar-wishlist';

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      }
    } catch (error) {
      console.error('Wishlist loading error:', error);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error('Wishlist saving error:', error);
    }
  }, [wishlist, loaded]);

  const isWishlisted = (id: string) =>
    wishlist.some((item) => item.id === id);

  const toggleWishlist = (product: WishlistProduct) => {
    setWishlist((previous) => {
      const exists = previous.some(
        (item) => item.id === product.id
      );

      return exists
        ? previous.filter((item) => item.id !== product.id)
        : [...previous, product];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      'useWishlist must be used inside WishlistProvider'
    );
  }

  return context;
}
