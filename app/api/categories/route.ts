import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  return NextResponse.json({ categories });
}
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json(); const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    const slug = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = await prisma.category.create({ data: { name, slug, imageUrl: body.imageUrl ? String(body.imageUrl) : null } });
    return NextResponse.json({ category }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Category already exists or could not be created.' }, { status: 400 }); }
}
