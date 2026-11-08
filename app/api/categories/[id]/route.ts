import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
  if (category._count.products) return NextResponse.json({ error: `This category has ${category._count.products} products. Move or delete those products first.` }, { status: 400 });
  await prisma.category.delete({ where: { id } }); return NextResponse.json({ success: true });
}
