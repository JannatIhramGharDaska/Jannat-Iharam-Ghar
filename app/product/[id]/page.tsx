
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductPurchase from '@/components/ProductPurchase';
import ProductImageGallery from '@/components/ProductImageGallery';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Truck, Star } from 'lucide-react';

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
    where: {
      productId: p.id,
      status: 'Approved',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      orderItem: {
        select: {
          order: {
            select: { customerName: true },
          },
        },
      },
    },
  });

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviews.length
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
    <main className="min-h-screen bg-[#080808] text-[#F5F0E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">

        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-[#FFD76A] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14">

          {/* Product Gallery */}
          <div className="rounded-2xl border border-[#B88932]/40 bg-[#141414] p-3 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
            <ProductImageGallery
              images={productImages}
              productName={p.name}
            />
          </div>

          {/* Product Information */}
          <section className="space-y-6">

            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-[#E8C46A]">
                {p.category.name}
                <span className="mx-2 text-[#777777]">•</span>
                SKU: {p.sku}
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#E9BA49] to-[#C58A22]">
                {p.name}
              </h1>

              {averageRating !== null ? (
                <a
                  href="#customer-reviews"
                  className="inline-flex flex-wrap items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                >
                  <span
                    className="flex items-center gap-0.5 text-[#FFD45C]"
                    aria-label={`${averageRating.toFixed(1)} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(averageRating)
                            ? 'fill-current'
                            : ''
                        }`}
                      />
                    ))}
                  </span>
                  <span className="font-semibold text-[#F5E4B6]">
                    {averageRating.toFixed(1)} / 5
                  </span>
                  <span className="text-[#AAA39A]">
                    ({reviews.length} reviews)
                  </span>
                </a>
              ) : (
                <p className="text-xs text-[#AAA39A]">
                  No reviews yet
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-[#C9C1B4] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {p.description}
            </p>

            {/* Price */}
            <div className="rounded-xl border border-[#B88932]/30 bg-[#15120E] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#FFD76A]">
                  PKR {(p.salePrice ?? p.price).toLocaleString()} /-
                </p>

                {p.salePrice !== null && (
                  <span className="rounded-full bg-[#7F1D1D] text-white text-[10px] font-bold px-3 py-1">
                    SALE
                  </span>
                )}
              </div>

              {p.salePrice !== null && (
                <p className="text-sm text-[#999999] line-through mt-2">
                  PKR {p.price.toLocaleString()} /-
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              {p.stock > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#377B54]/50 bg-[#10251A] text-[#8DE0A8] px-4 py-2 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#6CD990]" />
                  In Stock: {p.stock}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-[#A53C3C]/50 bg-[#301414] text-[#FFAAAA] px-4 py-2 text-xs font-semibold">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Existing Purchase System */}
            <div className="rounded-xl border border-[#B88932]/35 bg-[#141414] p-4 sm:p-6">
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
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-[#4D3B23] bg-[#131313] p-4">
                <ShieldCheck className="w-6 h-6 text-[#FFD76A] shrink-0" />
                <span className="text-xs text-[#D6CBB7]">
                  Quality Products
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#4D3B23] bg-[#131313] p-4">
                <Truck className="w-6 h-6 text-[#FFD76A] shrink-0" />
                <span className="text-xs text-[#D6CBB7]">
                  Delivery Across Pakistan
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Customer Reviews */}
        <section
          id="customer-reviews"
          className="mt-16 pt-10 border-t border-[#B88932]/40 scroll-mt-28"
        >
          <div className="space-y-3 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0A5] via-[#E9BA49] to-[#C58A22]">
              Customer Reviews
            </h2>

            {averageRating !== null ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#FFD45C] text-xl">
                  {'★'.repeat(Math.round(averageRating))}
                  {'☆'.repeat(5 - Math.round(averageRating))}
                </span>

                <span className="text-[#E5D6B8] text-sm">
                  {averageRating.toFixed(1)} out of 5
                  {' · '}
                  {reviews.length} verified{' '}
                  {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-[#AAA39A]">
                No reviews yet. Reviews from verified customers
                will appear here after approval.
              </p>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="grid md:grid-cols-2 gap-5">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-[#765A30]/50 bg-[#151515] p-5 sm:p-6 space-y-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className="text-[#FFD45C] text-lg tracking-wide"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#F3D27A] border border-[#B88932]/40 rounded-full px-3 py-1">
                      Verified Purchase
                    </span>
                  </div>

                  <p className="text-sm font-bold text-[#F7E8C3]">
                    {review.orderItem.order.customerName}
                  </p>

                  <p className="text-sm text-[#D0C7B9] whitespace-pre-wrap break-words leading-relaxed">
                    {review.comment}
                  </p>

                  <p className="text-xs text-[#918B83]">
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
      </div>
    </main>
  );
}