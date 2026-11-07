import {prisma} from '@/lib/prisma';
import ShopClient from '@/components/ShopClient';
export const dynamic='force-dynamic';
export default async function ShopPage(){const rows=await prisma.product.findMany({include:{category:true},orderBy:{createdAt:'desc'}});const products=rows.map(p=>({id:p.id,sku:p.sku,name:p.name,price:p.price,salePrice:p.salePrice,stock:p.stock,images:p.images,categoryName:p.category.name}));return <main className="max-w-7xl mx-auto px-4 py-10"><h1 className="text-3xl font-bold text-emerald-950 mb-2">Our Products</h1><p className="text-gray-600 mb-7">Islamic essentials and complete Umrah supplies</p><ShopClient products={products}/></main>}
