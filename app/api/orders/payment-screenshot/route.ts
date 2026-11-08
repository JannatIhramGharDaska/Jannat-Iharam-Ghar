import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');

  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
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

function validImage(bytes: Uint8Array, type: string) {
  if (type === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  if (type === 'image/webp') {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json(
      { error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary configuration is missing.' },
      { status: 500 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Please select a payment screenshot.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG and WEBP images are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Screenshot must be 5 MB or smaller.' },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    if (!validImage(bytes, file.type)) {
      return NextResponse.json(
        { error: 'Invalid image file.' },
        { status: 400 }
      );
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const folder = 'jannat-ihram-ghar/payment-screenshots';

    const params = { folder, timestamp };

    const upload = new FormData();
    upload.append('file', file);
    upload.append('api_key', apiKey);
    upload.append('timestamp', timestamp);
    upload.append('folder', folder);
    upload.append('signature', signature(params));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: upload,
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.secure_url) {
      console.error('Payment screenshot Cloudinary error:', result?.error);
      return NextResponse.json(
        { error: 'Screenshot upload failed. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error('Payment screenshot upload error:', error);

    return NextResponse.json(
      { error: 'Could not upload screenshot. Please try again.' },
      { status: 500 }
    );
  }
}