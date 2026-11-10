
'use client';

import WebsiteEditor from './WebsiteEditor';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  featured: boolean;
  images: string;
  categoryId: string;
  categoryName?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  orderNotes?: string | null;
  paymentMethod: string;
  paymentScreenshot: string | null;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  trackingNumber?: string | null;
  shippingProvider?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    variant?: string | null;
    product: {
      name: string;
      sku: string;
    };
  }>;
};

type Asset = {
  id: string;
  slot: string;
  label: string;
  url: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  status: string;
  trackingNumber?: string | null;
  shippingProvider?: string | null;
  createdAt: string;
  product: { name: string };
  orderItem: {
    order: { orderNumber: string; customerName: string };
  };
};

type Tab = 'orders' | 'products' | 'media' | 'design' | 'reviews';

export default function Dashboard() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewApiReady, setReviewApiReady] = useState(false);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});
  const [shippingDrafts, setShippingDrafts] = useState<Record<string, { trackingNumber: string; shippingProvider: string }>>({});
  const [shippingBusy, setShippingBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '0',
    category: 'Ihram',
    description: '',
    enableVariants: false,
    variants: [{ name: '', price: '' }],
  });

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; _count?: { products: number } }>
  >([]);

  const [categoryName, setCategoryName] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [mediaSlot, setMediaSlot] = useState('site-logo');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaBusy, setMediaBusy] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const me = await fetch('/api/admin/me').then((r) => r.json());

      if (!me.authenticated) {
        router.replace('/admin/login');
        return;
      }

      const [a, b, c, d] = await Promise.all([
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/media').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
      ]);

      setOrders(a.orders || []);
      setProducts(b.products || []);
      setAssets(c.assets || []);
      setCategories(d.categories || []);
      // Review listing is a separate admin endpoint; other dashboard data
      // remains available even if it has not been installed yet.
      try {
        const reviewResponse = await fetch('/api/reviews/admin', {
          cache: 'no-store',
        });
        setReviewApiReady(reviewResponse.ok);
        if (reviewResponse.ok) {
          const reviewData = await reviewResponse.json();
          setReviews(reviewData.reviews || []);
        }
      } catch {
        // The review panel will be available after its API is installed.
      }
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const r = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        stockMode: 'STANDARD',
        variants: form.enableVariants
          ? form.variants.filter(
              (variant) => variant.name.trim() !== '' && variant.price !== ''
            )
          : [],
      }),
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Could not add product');
      return;
    }

    setForm({
      name: '',
      sku: '',
      price: '',
      stock: '0',
      category: 'Ihram',
      description: '',
      enableVariants: false,
      variants: [{ name: '', price: '' }],
    });

    await load();
  }

  async function status(id: string, value: string) {
    const r = await fetch('/api/orders/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: value }),
    });

    if (!r.ok) {
      setError('Could not update order status');
      return;
    }

    await load();
  }

  async function saveShippingDetails(order: Order) {
    const draft = shippingDrafts[order.id] || {
      trackingNumber: order.trackingNumber || '',
      shippingProvider: order.shippingProvider || '',
    };

    if (!draft.trackingNumber.trim() || !draft.shippingProvider.trim()) {
      setError('Please enter both tracking number and shipping provider.');
      return;
    }

    setShippingBusy(order.id);
    setError('');

    try {
      const response = await fetch('/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: draft.trackingNumber.trim(),
          shippingProvider: draft.shippingProvider.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not save shipping details.');
      }

      setShippingDrafts((previous) => ({
        ...previous,
        [order.id]: draft,
      }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save shipping details.');
    } finally {
      setShippingBusy(null);
    }
  }

  async function updatePaymentStatus(id: string, value: string) {
    const r = await fetch('/api/orders/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: value }),
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Could not update payment status');
      return;
    }

    setError('');
    await load();
  }

  async function uploadMedia(e: React.FormEvent) {
    e.preventDefault();

    if (!mediaFiles.length) {
      setError('Please choose an image first.');
      return;
    }

    setMediaBusy(true);
    setError('');

    try {
      const isProductImage = mediaSlot.startsWith('product-image:');
      const filesToUpload = isProductImage ? mediaFiles : mediaFiles.slice(0, 1);

      for (const [index, file] of filesToUpload.entries()) {
        const fd = new FormData();
        fd.append('file', file);
        // A unique slot for every product photo prevents overwriting older photos.
        const slot = isProductImage
          ? `${mediaSlot}:${crypto.randomUUID()}`
          : mediaSlot;
        fd.append('slot', slot);
        fd.append('label', isProductImage
          ? `Product photo: ${file.name}`
          : mediaSlot.replaceAll('-', ' '));

        const r = await fetch('/api/media', {
          method: 'POST',
          body: fd,
        });
        const d = await r.json();
        if (!r.ok) {
          throw new Error(
            `Image ${index + 1} (${file.name}): ${d.error || 'Upload failed'}`
          );
        }
      }

      setMediaFiles([]);
      const el = document.getElementById('media-file') as HTMLInputElement | null;
      if (el) el.value = '';
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
      await load();
    } finally {
      setMediaBusy(false);
    }
  }

  async function deleteMedia(slot: string) {
    if (!confirm('Delete this image?')) return;

    const r = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot }),
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Delete failed');
    } else {
      await load();
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const r = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName }),
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Could not add category');
      return;
    }

    setCategoryName('');
    await load();
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return;

    const r = await fetch('/api/categories/' + id, {
      method: 'DELETE',
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Could not delete category');
      return;
    }

    await load();
  }

  async function updateProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!editingProduct) return;

    const r = await fetch('/api/products/' + editingProduct.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingProduct.name,
        sku: editingProduct.sku,
        description: editingProduct.description,
        price: editingProduct.price,
        stock: editingProduct.stock,
        salePrice: editingProduct.salePrice,
        featured: editingProduct.featured,
        images: editingProduct.images,
      }),
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Could not update product');
      return;
    }

    setEditingProduct(null);
    await load();
  }

  async function deleteProduct(p: Product) {
    const confirmed = confirm(
      `Kya tum "${p.name}" ko delete karna chahte ho?`
    );

    if (!confirmed) return;

    setError('');

    const r = await fetch('/api/products/' + p.id, {
      method: 'DELETE',
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Could not delete product');
      return;
    }

    await load();

    alert(
      d.archived
        ? 'Product archive kar diya gaya hai. Purane orders محفوظ rahenge.'
        : 'Product permanently delete ho gaya.'
    );
  }

  async function toggleFeatured(p: Product) {
    const r = await fetch('/api/products/' + p.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !p.featured }),
    });

    if (!r.ok) {
      setError('Could not update featured product');
      return;
    }

    await load();
  }

  async function generateReviewLink(orderItemId: string) {
    setReviewBusy(orderItemId);
    setError('');
    try {
      const response = await fetch('/api/reviews/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId }),
      });
      const data = await response.json();
      if (!response.ok || !data.reviewUrl) {
        throw new Error(data.error || 'Could not generate review link.');
      }
      setReviewLinks((prev) => ({ ...prev, [orderItemId]: data.reviewUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate review link.');
    } finally {
      setReviewBusy(null);
    }
  }

  async function changeReviewStatus(reviewId: string, value: 'Approved' | 'Rejected') {
    setReviewBusy(reviewId);
    setError('');
    try {
      const response = await fetch('/api/reviews/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status: value }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not update review.');
      }
      setReviews((previous) =>
        previous.map((review) =>
          review.id === reviewId ? { ...review, status: value } : review
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update review.');
    } finally {
      setReviewBusy(null);
    }
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.replace('/admin/login');
  }

  const categoryOptions = Array.from(
    new Set(
      products
        .map((p) => p.categoryName)
        .filter((v): v is string => Boolean(v))
    )
  );

  const categorySlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between gap-3 items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Jannat Ihram Ghar inventory and orders
          </p>
        </div>

        <button
          onClick={logout}
          className="border rounded px-4 py-2"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(['orders', 'products', 'reviews', 'media', 'design'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded capitalize ${
              tab === t ? 'bg-emerald-900 text-white' : 'bg-gray-200'
            }`}
          >
            {t === 'media'
              ? 'Image Management'
              : t === 'design'
                ? 'Website Editor'
                : t}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {tab === 'orders' && (
            <div className="bg-white border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {[
                      'Order / Date',
                      'Customer',
                      'Phone',
                      'Delivery Address',
                      'City',
                      'Payment',
                      'Payment Screenshot',
                      'Payment Status',
                      'Items',
                      'Total',
                      'Order Status',
                      'Shipping Details',
                    ].map((x) => (
                      <th key={x} className="p-3">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {orders.map((o) => {
                    const isCOD =
                      o.paymentMethod === 'Cash on Delivery (COD)';

                    const currentPaymentStatus = isCOD
                      ? 'Not Required'
                      : o.paymentStatus || 'Pending';

                    return (
                      <tr key={o.id} className="border-t align-top">
                        <td className="p-3 whitespace-nowrap">
                          {o.orderNumber}
                          <span className="block text-xs text-gray-500">
                            {new Date(o.createdAt).toLocaleString()}
                          </span>
                        </td>

                        <td className="p-3">{o.customerName}</td>

                        <td className="p-3 whitespace-nowrap">
                          {o.customerPhone}
                        </td>

                        <td className="p-3 min-w-48">
                          {o.deliveryAddress}
                          {o.orderNotes && (
                            <span className="block text-xs text-gray-500">
                              Note: {o.orderNotes}
                            </span>
                          )}
                        </td>

                        <td className="p-3">{o.city}</td>

                        <td className="p-3 min-w-32">
                          {o.paymentMethod}
                        </td>

                        <td className="p-3 min-w-36">
                          {o.paymentScreenshot ? (
                            <div className="space-y-2">
                              <a
                                href={o.paymentScreenshot}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={o.paymentScreenshot}
                                  alt="Customer payment screenshot"
                                  className="w-28 h-24 object-cover rounded border"
                                />
                              </a>

                              <a
                                href={o.paymentScreenshot}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-800 underline text-xs"
                              >
                                View Full Screenshot
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400">
                              {isCOD ? 'Not Required' : 'No Screenshot'}
                            </span>
                          )}
                        </td>

                        <td className="p-3 min-w-40">
                          {isCOD ? (
                            <span className="text-gray-500 font-medium">
                              Not Required
                            </span>
                          ) : (
                            <div className="space-y-2">
                              <span
                                className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                                  currentPaymentStatus === 'Verified'
                                    ? 'bg-green-100 text-green-800'
                                    : currentPaymentStatus === 'Rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {currentPaymentStatus}
                              </span>

                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  disabled={currentPaymentStatus === 'Verified'}
                                  onClick={() =>
                                    updatePaymentStatus(o.id, 'Verified')
                                  }
                                  className="bg-emerald-700 text-white rounded px-2 py-1 text-xs disabled:opacity-40"
                                >
                                  Verify Payment
                                </button>

                                <button
                                  type="button"
                                  disabled={currentPaymentStatus === 'Rejected'}
                                  onClick={() =>
                                    updatePaymentStatus(o.id, 'Rejected')
                                  }
                                  className="bg-red-600 text-white rounded px-2 py-1 text-xs disabled:opacity-40"
                                >
                                  Reject Payment
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="p-3 min-w-48">
                          {o.items?.map((it, i) => (
                            <div key={it.id || i} className="mb-1">
                              {it.product?.name || 'Product'} × {it.quantity}
                              <span className="block text-xs text-gray-500">
                                PKR {(it.price * it.quantity).toLocaleString()}
                              </span>
                              {it.variant && (
                                <span className="block text-xs text-gray-500">Variant: {it.variant}</span>
                              )}
                              {o.status === 'Delivered' &&
                                Date.now() < new Date(o.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000 && (
                                  <div className="mt-2 space-y-1">
                                    <button
                                      type="button"
                                      disabled={reviewBusy === it.id}
                                      onClick={() => generateReviewLink(it.id)}
                                      className="border border-emerald-700 text-emerald-800 rounded px-2 py-1 text-xs disabled:opacity-50"
                                    >
                                      {reviewBusy === it.id ? 'Generating...' : 'Generate Review Link'}
                                    </button>
                                    {reviewLinks[it.id] && (
                                      <div className="flex flex-wrap gap-2 items-center">
                                        <button
                                          type="button"
                                          className="text-emerald-800 underline text-xs"
                                          onClick={() => navigator.clipboard.writeText(reviewLinks[it.id])
                                            .then(() => alert('Review link copied'))
                                            .catch(() => setError('Could not copy link.'))}
                                        >
                                          Copy Link
                                        </button>
                                        <a
                                          href={`https://wa.me/?text=${encodeURIComponent('Please review your purchase: ' + reviewLinks[it.id])}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-800 underline text-xs"
                                        >
                                          Share on WhatsApp
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          PKR {o.total.toLocaleString()}
                        </td>

                        <td className="p-3 min-w-32">
                          <select
                            value={o.status}
                            onChange={(e) => status(o.id, e.target.value)}
                            className="border rounded p-1"
                          >
                            {[
                              'Pending',
                              'Confirmed',
                              'Processing',
                              'Shipped',
                              'Delivered',
                              'Cancelled',
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3 min-w-56">
                          <div className="space-y-2">
                            <select
                              value={shippingDrafts[o.id]?.shippingProvider ?? o.shippingProvider ?? ''}
                              onChange={(e) =>
                                setShippingDrafts((previous) => ({
                                  ...previous,
                                  [o.id]: {
                                    trackingNumber: previous[o.id]?.trackingNumber ?? o.trackingNumber ?? '',
                                    shippingProvider: e.target.value,
                                  },
                                }))
                              }
                              className="border rounded p-2 w-full"
                              aria-label={`Shipping provider for ${o.orderNumber}`}
                            >
                              <option value="">Select courier</option>
                              {['TCS', 'Leopards', 'M&P', 'PostEx', 'Pakistan Post', 'Other'].map((provider) => (
                                <option key={provider} value={provider}>{provider}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={shippingDrafts[o.id]?.trackingNumber ?? o.trackingNumber ?? ''}
                              onChange={(e) =>
                                setShippingDrafts((previous) => ({
                                  ...previous,
                                  [o.id]: {
                                    trackingNumber: e.target.value,
                                    shippingProvider: previous[o.id]?.shippingProvider ?? o.shippingProvider ?? '',
                                  },
                                }))
                              }
                              placeholder="Tracking number"
                              maxLength={100}
                              className="border rounded p-2 w-full"
                              aria-label={`Tracking number for ${o.orderNumber}`}
                            />

                            <button
                              type="button"
                              onClick={() => saveShippingDetails(o)}
                              disabled={shippingBusy === o.id}
                              className="bg-emerald-800 text-white rounded px-3 py-2 text-xs w-full disabled:opacity-50"
                            >
                              {shippingBusy === o.id ? 'Saving...' : 'Save Tracking Details'}
                            </button>

                            {o.trackingNumber && o.shippingProvider && (
                              <p className="text-xs text-emerald-800">
                                Saved: {o.shippingProvider} · {o.trackingNumber}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!orders.length && (
                <p className="p-5 text-gray-500">No orders yet.</p>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <section className="bg-white border rounded-lg p-5 space-y-4">
              <div>
                <h2 className="font-bold text-lg">Customer Reviews</h2>
                <p className="text-sm text-gray-500">
                  Reviews appear on the storefront only after approval.
                </p>
              </div>
              {!reviewApiReady && (
                <p className="text-amber-700 text-sm">Review approval API is not installed yet. We will add it in the next step.</p>
              )}
              {reviewApiReady && reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviews found yet.</p>
              ) : reviewApiReady ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-semibold">{review.product.name}</p>
                          <p className="text-sm text-gray-600">
                            {review.orderItem.order.customerName} · {review.orderItem.order.orderNumber}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">{review.rating}/5 ★ · {review.status}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleString()}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={reviewBusy === review.id || review.status === 'Approved'}
                          onClick={() => changeReviewStatus(review.id, 'Approved')}
                          className="bg-emerald-800 text-white rounded px-3 py-2 text-sm disabled:opacity-40"
                        >Approve</button>
                        <button
                          type="button"
                          disabled={reviewBusy === review.id || review.status === 'Rejected'}
                          onClick={() => changeReviewStatus(review.id, 'Rejected')}
                          className="border border-red-500 text-red-700 rounded px-3 py-2 text-sm disabled:opacity-40"
                        >Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          )}

          {tab === 'products' && (
            <div className="space-y-6">
              <form
                onSubmit={add}
                className="bg-white border rounded-lg p-5 grid sm:grid-cols-2 gap-3"
              >
                <h2 className="font-bold sm:col-span-2">Add Product</h2>

                {(
                  ['name', 'sku', 'price', 'stock', 'category', 'description'] as const
                ).map((k) => (
                  <input
                    key={k}
                    required={['name', 'sku', 'price', 'category'].includes(k)}
                    placeholder={k}
                    value={form[k]}
                    onChange={(e) =>
                      setForm({ ...form, [k]: e.target.value })
                    }
                    className="border rounded p-2"
                  />
                ))}

                <label className="flex items-center gap-2 sm:col-span-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.enableVariants}
                    onChange={(e) =>
                      setForm({ ...form, enableVariants: e.target.checked })
                    }
                  />
                  Enable Variants
                </label>

                {form.enableVariants && (
                  <div className="sm:col-span-2 border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">Product Variants</h3>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            variants: [...form.variants, { name: '', price: '' }],
                          })
                        }
                        className="border border-emerald-800 text-emerald-900 rounded px-3 py-1 text-sm"
                      >
                        + Add Variant
                      </button>
                    </div>

                    {form.variants.map((variant, index) => (
                      <div
                        key={index}
                        className="grid sm:grid-cols-2 gap-2 items-center"
                      >
                        <input
                          value={variant.name}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              variants: form.variants.map((item, i) =>
                                i === index
                                  ? { ...item, name: e.target.value }
                                  : item
                              ),
                            })
                          }
                          placeholder={`Variant ${index + 1} name`}
                          required={form.enableVariants}
                          className="border rounded p-2"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                variants: form.variants.map((item, i) =>
                                  i === index
                                    ? { ...item, price: e.target.value }
                                    : item
                                ),
                              })
                            }
                            placeholder="Variant price (PKR)"
                            required={form.enableVariants}
                            className="border rounded p-2 w-full"
                          />
                          {form.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  variants: form.variants.filter(
                                    (_, i) => i !== index
                                  ),
                                })
                              }
                              className="text-red-600 border border-red-200 rounded px-3"
                              title="Remove variant"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      Har variant ka apna naam aur price enter karein.
                    </p>
                  </div>
                )}

                <button className="bg-emerald-900 text-white rounded p-3 sm:col-span-2">
                  Save Product
                </button>
              </form>

              <section className="bg-white border rounded-lg p-5 space-y-3">
                <h2 className="font-bold">Manage Shop Categories</h2>

                <form onSubmit={addCategory} className="flex gap-2">
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    placeholder="New category name"
                    className="border rounded p-2 flex-1"
                  />

                  <button className="bg-emerald-900 text-white rounded px-4">
                    Add Category
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-sm"
                    >
                      {c.name}
                      <small className="text-gray-500">
                        ({c._count?.products || 0})
                      </small>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        className="text-red-600 font-bold"
                        title="Delete category"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              {editingProduct && (
                <form
                  onSubmit={updateProduct}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-5 grid sm:grid-cols-2 gap-3"
                >
                  <h2 className="font-bold sm:col-span-2">
                    Edit Product: {editingProduct.name}
                  </h2>

                  {(
                    ['name', 'sku', 'price', 'salePrice', 'stock', 'description'] as const
                  ).map((k) => (
                    <label
                      key={k}
                      className="text-xs font-semibold capitalize"
                    >
                      {k}
                      <input
                        value={(editingProduct as any)[k] ?? ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            [k]:
                              k === 'price' ||
                              k === 'salePrice' ||
                              k === 'stock'
                                ? e.target.value === ''
                                  ? null
                                  : Number(e.target.value)
                                : e.target.value,
                          })
                        }
                        className="border rounded p-2 w-full mt-1"
                      />
                    </label>
                  ))}

                  <label className="text-xs font-semibold sm:col-span-2">
                    Product image URL (first image)
                    <input
                      value={(() => {
                        try {
                          return JSON.parse(editingProduct.images || '[]')[0] || '';
                        } catch {
                          return '';
                        }
                      })()}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          images: JSON.stringify([
                            e.target.value,
                            ...(() => {
                              try {
                                const all = JSON.parse(editingProduct.images || '[]');
                                return Array.isArray(all) ? all.slice(1) : [];
                              } catch {
                                return [];
                              }
                            })(),
                          ]),
                        })
                      }
                      className="border rounded p-2 w-full mt-1"
                      placeholder="https://..."
                    />
                  </label>

                  <label className="text-xs font-semibold">
                    Category
                    <select
                      value={editingProduct.categoryId}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          categoryId: e.target.value,
                        })
                      }
                      className="border rounded p-2 w-full mt-1"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={editingProduct.featured}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          featured: e.target.checked,
                        })
                      }
                    />{' '}
                    Show on homepage as featured
                  </label>

                  <div className="flex gap-2 sm:col-span-2">
                    <button className="bg-emerald-900 text-white rounded px-4 py-2">
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="border rounded px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {[
                        'SKU',
                        'Name',
                        'Category',
                        'Price',
                        'Stock',
                        'Featured',
                        'Actions',
                      ].map((x) => (
                        <th key={x} className="p-3">{x}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-3">{p.sku}</td>
                        <td className="p-3">{p.name}</td>
                        <td className="p-3">{p.categoryName}</td>
                        <td className="p-3">
                          PKR {p.price.toLocaleString()}
                        </td>
                        <td className="p-3">{p.stock}</td>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={!!p.featured}
                            onChange={() => toggleFeatured(p)}
                          />
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setEditingProduct({ ...p })}
                              className="text-emerald-900 underline"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => deleteProduct(p)}
                              className="text-red-600 underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'design' && <WebsiteEditor />}

          {tab === 'media' && (
            <div className="space-y-5">
              <form
                onSubmit={uploadMedia}
                className="bg-white border rounded-lg p-5 space-y-3"
              >
                <h2 className="font-bold text-lg">
                  {mediaSlot.startsWith('product-image:')
                    ? 'Add Product Images'
                    : 'Upload / Replace Website Image'}
                </h2>

                <p className="text-sm text-gray-500">
                  Images are stored online in Cloudinary, not on this computer.
                </p>

                <label className="block text-sm font-medium">
                  Image location
                </label>

                <select
                  value={mediaSlot}
                  onChange={(e) => {
                    setMediaSlot(e.target.value);
                    setMediaFiles([]);
                    const el = document.getElementById('media-file') as HTMLInputElement | null;
                    if (el) el.value = '';
                  }}
                  className="border rounded p-2 w-full"
                >
                  <option value="site-logo">Website Logo</option>
                  <option value="hero-banner">Homepage Main Banner</option>

                  {products.map((p) => (
                    <option key={p.id} value={`product-image:${p.id}`}>
                      Product: {p.name}
                    </option>
                  ))}

                  {categoryOptions.map((name) => (
                    <option key={name} value={`category-image:${categorySlug(name)}`}>
                      Category: {name}
                    </option>
                  ))}
                </select>

                <input
                  id="media-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  multiple={mediaSlot.startsWith('product-image:')}
                  onChange={(e) =>
                    setMediaFiles(Array.from(e.target.files || []))
                  }
                  className="block w-full border rounded p-2"
                />

                {mediaSlot.startsWith('product-image:') && (
                  <p className="text-sm text-gray-600">
                    Multiple photos select kar sakte hain. Nayi photos purani photos ko replace nahi karengi.
                  </p>
                )}

                <button
                  disabled={mediaBusy || !mediaFiles.length}
                  className="bg-emerald-900 text-white rounded px-5 py-3 disabled:opacity-50"
                >
                  {mediaBusy
                    ? 'Uploading...'
                    : mediaSlot.startsWith('product-image:')
                      ? `Add ${mediaFiles.length || ''} Product Image${mediaFiles.length === 1 ? '' : 's'}`
                      : 'Upload / Replace Image'}
                </button>
              </form>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((a) => (
                  <div key={a.id} className="bg-white border rounded-lg p-3">
                    <img
                      src={a.url}
                      alt={a.label}
                      className="w-full h-40 object-contain bg-gray-50 rounded"
                    />

                    <p className="font-semibold text-sm mt-2">{a.label}</p>

                    <p className="text-xs text-gray-500 break-all">
                      {a.slot}
                    </p>

                    <button
                      onClick={() => deleteMedia(a.slot)}
                      className="mt-2 text-sm text-red-600 border border-red-200 rounded px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {!assets.length && (
                <p className="text-sm text-gray-500">
                  No custom images uploaded yet.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
