
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductPurchase from '@/components/ProductPurchase';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const p = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!p) notFound();

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div className="bg-white rounded-xl overflow-hidden border">
        <img
          src={(JSON.parse(p.images || '[]')[0] || '/images/placeholder.svg')}
          alt={p.name}
          className="w-full aspect-square object-cover"
        />
      </div>

      <section className="space-y-4">
        <p className="text-sm text-emerald-800">
          {p.category.name} · SKU: {p.sku}
        </p>

        <h1 className="text-3xl font-bold text-emerald-950">{p.name}</h1>
        <p className="text-gray-600">{p.description}</p>

        <p className="text-2xl font-bold text-emerald-900">
          PKR {(p.salePrice ?? p.price).toLocaleString()}
        </p>

        {p.salePrice !== null && (
          <p className="line-through text-gray-400">
            PKR {p.price.toLocaleString()}
          </p>
        )}

        <p className="text-sm">
          {p.stock > 0 ? `In stock: ${p.stock}` : 'Out of stock'}
        </p>

        <ProductPurchase product={{ id:p.id, sku:p.sku, name:p.name, price:p.price, salePrice:p.salePrice, stock:p.stock, image:(JSON.parse(p.images || '[]')[0] || '/images/placeholder.svg') }} />
        <a href="/shop" className="inline-block text-emerald-900 underline text-sm">Back to Shop</a>
      </section>
    </main>
  );
}
