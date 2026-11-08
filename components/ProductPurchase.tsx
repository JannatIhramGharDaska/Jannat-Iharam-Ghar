'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
export default function ProductPurchase({ product }: { product: { id:string; sku:string; name:string; price:number; salePrice:number|null; stock:number; image:string } }) {
  const { addToCart } = useCart(); const router = useRouter(); const [qty,setQty] = useState(1);
  const add = () => addToCart({ id:`${product.id}-default`, productId:product.id, sku:product.sku, name:product.name, price:product.salePrice ?? product.price, image:product.image, quantity:qty });
  return <div className="space-y-3 pt-3">
    <div className="flex items-center gap-3"><span className="text-sm font-semibold">Quantity</span><div className="flex border rounded"><button type="button" className="px-3 py-1" onClick={()=>setQty(Math.max(1,qty-1))}>−</button><span className="px-4 py-1">{qty}</span><button type="button" className="px-3 py-1" onClick={()=>setQty(Math.min(product.stock,qty+1))}>+</button></div></div>
    <button disabled={product.stock<=0} onClick={()=>{add();alert('Added to cart');}} className="w-full rounded bg-emerald-900 text-white font-bold py-3 flex items-center justify-center gap-2 disabled:bg-gray-300"><ShoppingBag className="w-4 h-4"/> Add to Cart</button>
    <button disabled={product.stock<=0} onClick={()=>{add();router.push('/checkout');}} className="w-full rounded border border-emerald-900 text-emerald-900 font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-40"><Zap className="w-4 h-4"/> Place Order</button>
  </div>;
}
