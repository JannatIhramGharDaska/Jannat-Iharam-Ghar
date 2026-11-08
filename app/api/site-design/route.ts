import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
import { DEFAULT_SITE_DESIGN, normalizeSiteDesign } from '@/lib/site-design';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
}

async function getOrCreate() {
  return prisma.siteDesign.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      draft: DEFAULT_SITE_DESIGN as unknown as Prisma.InputJsonValue,
      published: DEFAULT_SITE_DESIGN as unknown as Prisma.InputJsonValue
    }
  });
}

export async function GET(req: Request) {
  try {
    const adminMode = new URL(req.url).searchParams.get('mode') === 'admin';
    if (adminMode && !(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const record = await getOrCreate();
    return NextResponse.json({ design: adminMode ? record.draft : record.published });
  } catch (error) {
    console.error('Site design read error', error);
    return NextResponse.json({ error: 'Could not load website design.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const design = normalizeSiteDesign(body?.design);
    await getOrCreate();
    const publish = body?.publish === true;
    const record = await prisma.siteDesign.update({
      where: { id: 'main' },
      data: {
        draft: design as unknown as Prisma.InputJsonValue,
        ...(publish ? { published: design as unknown as Prisma.InputJsonValue } : {})
      }
    });
    return NextResponse.json({ success: true, published: publish, design: publish ? record.published : record.draft });
  } catch (error) {
    console.error('Site design save error', error);
    return NextResponse.json({ error: 'Could not save website design.' }, { status: 500 });
  }
}
