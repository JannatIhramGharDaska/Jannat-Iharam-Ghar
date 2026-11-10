import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductPurchase from '@/components/ProductPurchase';
import ProductImageGallery from '@/components/ProductImageGallery';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
    },
  });

  if (!p) notFound();

  const reviews = await prisma.review.findMany({
    where: { productId: p.id, status: 'Approved' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      orderItem: {
        select: {
          order: { select: { customerName: true } },
        },
      },
    },
  });

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  let productImages: string[] = [];

  try {
    const parsed: unknown = JSON.parse(p.images || '[]');

    if (Array.isArray(parsed)) {
      productImages = parsed.filter(
        (image): image is string =>
          typeof image === 'string' && image.trim() !== ''
      );
    }
  } catch {
    productImages = [];
  }

  if (productImages.length === 0) {
    productImages = ['/images/placeholder.svg'];
  }

  const productImage = productImages[0];

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <div className="grid md:grid-cols-2 gap-10">
        <ProductImageGallery
          images={productImages}
          productName={p.name}
        />

        <section className="space-y-4">
          <p className="text-sm text-emerald-800">
            {p.category.name} · SKU: {p.sku}
          </p>

          <h1 className="text-3xl font-bold text-emerald-950">
            {p.name}
          </h1>

          {averageRating !== null && (
            <a href="#customer-reviews" className="inline-flex items-center gap-2 text-sm">
              <span className="text-amber-500" aria-hidden="true">★</span>
              <span className="font-semibold">{averageRating.toFixed(1)} / 5</span>
              <span className="text-gray-500">({reviews.length} reviews)</span>
            </a>
          )}

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

          <ProductPurchase
            product={{
              id: p.id,
              sku: p.sku,
              name: p.name,
              price: p.price,
              salePrice: p.salePrice,
              stock: p.stock,
              image: productImage,
              variants: p.variants.map((variant) => ({
                name: variant.name,
                price: variant.price,
              })),
            }}
          />

          <a
            href="/shop"
            className="inline-block text-emerald-900 underline text-sm"
          >
            Back to Shop
          </a>
        </section>
      </div>

      <section id="customer-reviews" className="space-y-5 border-t pt-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-emerald-950">
            Customer Reviews
          </h2>
          {averageRating !== null ? (
            <p className="text-sm text-gray-600">
              <span className="text-amber-500" aria-hidden="true">★</span>{' '}
              {averageRating.toFixed(1)} out of 5 · {reviews.length}{' '}
              verified {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              No reviews yet. Reviews from verified customers will appear here after approval.
            </p>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border bg-white p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="text-amber-500 text-lg tracking-wide"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="text-xs text-emerald-800 font-semibold">
                    Verified Purchase
                  </span>
                </div>
                <p className="text-sm font-semibold text-emerald-950">
                  {review.orderItem.order.customerName}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {review.comment}
                </p>
                <p className="text-xs text-gray-500">
                  {review.createdAt.toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'Asia/Karachi',
                  })}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
