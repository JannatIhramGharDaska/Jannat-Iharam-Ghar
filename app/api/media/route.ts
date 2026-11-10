import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const cloudName = () => process.env.CLOUDINARY_CLOUD_NAME;

// Supports old slots (product-image:<productId>) and new slots
// (product-image:<productId>:<uniqueImageId>).
const PRODUCT_SLOT = /^product-image:([A-Za-z0-9_-]{1,80})(?::([A-Za-z0-9_-]{1,80}))?$/;

function productIdFromSlot(slot: string): string | null {
  return PRODUCT_SLOT.exec(slot)?.[1] ?? null;
}

function readImages(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function signature(params: Record<string, string>) {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1')
    .update(base + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');
}

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

function validSlot(slot: string) {
  return (
    slot === 'site-logo' ||
    slot === 'hero-banner' ||
    PRODUCT_SLOT.test(slot) ||
    /^category-image:[a-z0-9-]{1,100}$/.test(slot)
  );
}

async function cloudinaryDestroy(publicId: string) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { public_id: publicId, timestamp };
  const body = new FormData();
  body.append('public_id', publicId);
  body.append('api_key', process.env.CLOUDINARY_API_KEY!);
  body.append('timestamp', timestamp);
  body.append('signature', signature(params));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName()}/image/destroy`,
    { method: 'POST', body }
  );
  const result = await response.json().catch(() => null);
  return response.ok && result?.result === 'ok';
}

// Public read access is needed by the website's logo, banner and product images.
export async function GET() {
  try {
    const assets = await prisma.mediaAsset.findMany({
      orderBy: { slot: 'asc' },
    });
    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Media listing error', error);
    return NextResponse.json(
      { error: 'Could not load website images.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (
    !cloudName() ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      { error: 'Cloudinary environment variables are missing.' },
      { status: 500 }
    );
  }

  let uploadedPublicId: string | undefined;

  try {
    const form = await req.formData();
    const file = form.get('file');
    const slot = String(form.get('slot') || '').trim();
    const label = String(form.get('label') || slot).trim().slice(0, 120);

    if (!validSlot(slot)) {
      return NextResponse.json({ error: 'Invalid image location.' }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Please choose an image.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Use JPG, PNG, WEBP, GIF or AVIF images only.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image must be 5 MB or smaller.' },
        { status: 400 }
      );
    }

    const productId = productIdFromSlot(slot);
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        return NextResponse.json(
          { error: 'Selected product was not found.' },
          { status: 404 }
        );
      }
    }

    if (slot.startsWith('category-image:')) {
      const slug = slot.slice('category-image:'.length);
      const category = await prisma.category.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Selected category was not found.' },
          { status: 404 }
        );
      }
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const params = { folder: 'jannat-ihram-ghar', timestamp };
    const upload = new FormData();
    upload.append('file', file);
    upload.append('api_key', process.env.CLOUDINARY_API_KEY!);
    upload.append('timestamp', timestamp);
    upload.append('folder', params.folder);
    upload.append('signature', signature(params));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName()}/image/upload`,
      { method: 'POST', body: upload }
    );
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.secure_url || !result?.public_id) {
      return NextResponse.json(
        { error: result?.error?.message || 'Cloudinary upload failed.' },
        { status: 502 }
      );
    }
    uploadedPublicId = result.public_id;

    const old = await prisma.mediaAsset.findUnique({ where: { slot } });
    const asset = await prisma.mediaAsset.upsert({
      where: { slot },
      update: {
        label,
        url: result.secure_url,
        publicId: result.public_id,
      },
      create: {
        slot,
        label,
        url: result.secure_url,
        publicId: result.public_id,
      },
    });

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { images: true },
      });
      if (product) {
        const images = readImages(product.images);
        // For new unique slots, append without replacing any existing image.
        // For an old slot reused manually, replace only that slot's old URL.
        const remaining = old?.url
          ? images.filter((url) => url !== old.url)
          : images;
        const newImages = remaining.filter((url) => url !== result.secure_url);
        const isPlaceholder = (url: string) => url === '/images/placeholder.svg';
        const cleanImages = newImages.filter((url) => !isPlaceholder(url));

        await prisma.product.update({
          where: { id: productId },
          data: { images: JSON.stringify([...cleanImages, result.secure_url]) },
        });
      }
    }

    if (slot.startsWith('category-image:')) {
      const slug = slot.slice('category-image:'.length);
      await prisma.category.update({
        where: { slug },
        data: { imageUrl: result.secure_url },
      });
    }

    if (old?.publicId && old.publicId !== result.public_id) {
      try {
        await cloudinaryDestroy(old.publicId);
      } catch (error) {
        console.error('Could not clean up old Cloudinary image', error);
      }
    }

    uploadedPublicId = undefined;
    return NextResponse.json({ asset });
  } catch (error) {
    if (
      uploadedPublicId &&
      cloudName() &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        await cloudinaryDestroy(uploadedPublicId);
      } catch {
        // Best-effort cleanup.
      }
    }
    console.error('Media upload error', error);
    return NextResponse.json(
      { error: 'Could not upload image. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (
    !cloudName() ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      { error: 'Cloudinary environment variables are missing.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const slot = String(body?.slot || '').trim();
    if (!validSlot(slot)) {
      return NextResponse.json({ error: 'Invalid image location.' }, { status: 400 });
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { slot } });
    if (!asset) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    }

    if (!(await cloudinaryDestroy(asset.publicId))) {
      return NextResponse.json(
        { error: 'Cloudinary could not confirm image deletion. The database record was kept.' },
        { status: 502 }
      );
    }

    await prisma.mediaAsset.delete({ where: { slot } });

    if (slot.startsWith('category-image:')) {
      await prisma.category.updateMany({
        where: { slug: slot.slice('category-image:'.length) },
        data: { imageUrl: null },
      });
    }

    const productId = productIdFromSlot(slot);
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { images: true },
      });
      if (product) {
        const remaining = readImages(product.images).filter(
          (url) => url !== asset.url
        );
        await prisma.product.update({
          where: { id: productId },
          data: { images: JSON.stringify(remaining) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media delete error', error);
    return NextResponse.json(
      { error: 'Could not delete image. Please try again.' },
      { status: 500 }
    );
  }
}
