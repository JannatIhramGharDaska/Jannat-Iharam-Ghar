
'use client';

import WebsiteEditor from './WebsiteEditor';
import SalesAnalytics from './SalesAnalytics';
import CouponManager from './CouponManager';
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
  isNew?: boolean;
  adminNotes?: string | null;
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
    reviewInvite?: {
      generationCount: number;
      lastGeneratedAt: string | null;
    } | null;
    review?: { id: string } | null;
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

type Tab = 'analytics' | 'orders' | 'products' | 'media' | 'design' | 'reviews' | 'coupons';

export default function Dashboard() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('analytics');
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
      await load();
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

  const newOrdersCount = orders.filter((order) => order.isNew).length;

  return (
    <main className="jig-admin min-h-screen max-w-none bg-[#080808] text-[#F5E8C8] px-4 sm:px-6 lg:px-10 py-8">
      <style>{`
        .jig-admin { color-scheme: dark; }
        .jig-admin .bg-white, .jig-admin .bg-gray-50, .jig-admin .bg-gray-200,
        .jig-admin .bg-amber-50, .jig-admin .bg-emerald-50 { background-color: #171717 !important; }
        .jig-admin .bg-amber-100 { background-color: #3b2b11 !important; }
        .jig-admin .bg-green-100 { background-color: #143525 !important; }
        .jig-admin .bg-red-100 { background-color: #3a1919 !important; }
        .jig-admin .text-emerald-950, .jig-admin .text-emerald-900,
        .jig-admin .text-emerald-800, .jig-admin .text-emerald-700,
        .jig-admin .text-amber-900, .jig-admin .text-amber-800 { color: #f3cf75 !important; }
        .jig-admin .text-gray-900, .jig-admin .text-gray-800,
        .jig-admin .text-gray-700, .jig-admin .text-gray-600 { color: #d9d0c0 !important; }
        .jig-admin .text-gray-500, .jig-admin .text-gray-400 { color: #aaa194 !important; }
        .jig-admin .border-gray-200, .jig-admin .border-gray-300,
        .jig-admin .border-amber-200, .jig-admin .border-amber-300,
        .jig-admin .border-emerald-200 { border-color: #71582c !important; }
        .jig-admin input:not([type=checkbox]):not([type=file]),
        .jig-admin select, .jig-admin textarea {
          background: #0e0e0e !important; color: #f8e9c5 !important;
          border: 1px solid #87672e !important; border-radius: 9px;
          padding: 10px; max-width: 100%;
        }
        .jig-admin input::placeholder, .jig-admin textarea::placeholder { color: #978c79; }
        .jig-admin input:focus, .jig-admin select:focus, .jig-admin textarea:focus {
          outline: 2px solid #e2b64b; outline-offset: 1px;
        }
        .jig-admin input[type=file] { color: #e9d9b5; background: #161616; border-color: #87672e; }
        .jig-admin input[type=checkbox] { accent-color: #d4a63c; }
        .jig-admin option { background: #141414; color: #f8e9c5; }
        .jig-admin .bg-emerald-900, .jig-admin .bg-emerald-800,
        .jig-admin .bg-emerald-700 { background: linear-gradient(100deg,#b77b1d,#ffe08a,#bf8b2c) !important; color: #17110a !important; font-weight: 700; }
        .jig-admin button { transition: filter .18s, background-color .18s; }
        .jig-admin button:hover:not(:disabled) { filter: brightness(1.15); }
        .jig-admin button:disabled { opacity: .45; cursor: not-allowed; }
        .jig-admin table { border-collapse: separate; border-spacing: 0; min-width: 760px; }
        .jig-admin th { color: #f7d786; background: #211a10; font-weight: 700; white-space: nowrap; }
        .jig-admin td { color: #e5dbca; border-color: #473820; }
        .jig-admin tr { border-color: #473820; }
        .jig-admin tbody tr:hover { background: #211c14; }
        .jig-admin section, .jig-admin form { border-color: #6b512a; }
        .jig-admin .rounded-lg.bg-white, .jig-admin .rounded-lg.bg-amber-50,
        .jig-admin section.bg-white, .jig-admin form.bg-white {
          border: 1px solid #70562d !important; box-shadow: 0 10px 28px #0005;
        }
        .jig-admin h1, .jig-admin h2 { color: #f3cf75; }
        .jig-admin h1 { background: linear-gradient(90deg,#fff0a5,#e9ba49,#b77b1d); background-clip: text; -webkit-background-clip: text; color: transparent; }
        .jig-admin a { color: #f2cf7a; }
      `}</style>
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
          className="border border-[#a57c35] text-[#f5d480] bg-[#171717] rounded-lg px-4 py-2"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(['analytics', 'orders', 'products', 'reviews', 'coupons', 'media', 'design'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              tab === t ? 'bg-gradient-to-r from-[#b77b1d] via-[#ffe08a] to-[#bf8b2c] text-[#17110a] font-bold' : 'bg-[#1c1c1c] text-[#e7cc8a] border border-[#72572b]'
            }`}
          >
            {t === 'media'
              ? 'Image Management'
              : t === 'design'
                ? 'Website Editor'
                : t === 'orders'
                  ? `Orders${newOrdersCount > 0 ? ` (${newOrdersCount} NEW)` : ''}`
                  : t}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {tab === 'analytics' && <SalesAnalytics orders={orders} />}
          {tab === 'coupons' && <CouponManager />}

          {tab === 'orders' && (
            <div className="space-y-4">
              {newOrdersCount > 0 && (
                <div className="rounded-xl border border-[#a57c35] bg-[#211a10] px-4 py-3 text-[#f3cf75]">
                  <strong>{newOrdersCount} new order{newOrdersCount === 1 ? '' : 's'} received.</strong>
                  <span className="ml-1">Open an order to view its details and clear its NEW status.</span>
                </div>
              )}

              <div className="grid gap-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-[#70562d] bg-[#171717] p-4 shadow-lg shadow-black/20"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-[#aaa194]">Order Number</p>
                        <p className="break-words font-semibold text-[#f3cf75]">{o.orderNumber}</p>
                        {o.isNew && (
                          <span className="mt-1 inline-flex rounded-full bg-[#3b2b11] px-2 py-0.5 text-[10px] font-bold text-[#ffe08a]">NEW</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-[#aaa194]">Customer Name</p>
                        <p className="break-words text-[#f5e8c8]">{o.customerName}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-[#aaa194]">Phone Number</p>
                        <p className="break-words text-[#f5e8c8]">{o.customerPhone}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-[#aaa194]">City</p>
                        <p className="break-words text-[#f5e8c8]">{o.city}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-[#aaa194]">Payment Method</p>
                        <p className="break-words text-[#f5e8c8]">{o.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end border-t border-[#473820] pt-4">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/orders/${o.id}`)}
                        className="rounded-lg bg-gradient-to-r from-[#b77b1d] via-[#ffe08a] to-[#bf8b2c] px-5 py-2.5 text-sm font-bold text-[#17110a]"
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                ))}
                {!orders.length && (
                  <p className="rounded-xl border border-[#70562d] bg-[#171717] p-5 text-[#aaa194]">No orders yet.</p>
                )}
              </div>
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
                      className="border border-[#a57c35] text-[#f5d480] bg-[#171717] rounded-lg px-4 py-2"
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
                          PKR {p.price.toLocaleString()} /-
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
