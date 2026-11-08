export type SiteDesign = {
  colors: { primary: string; accent: string; background: string; text: string };
  hero: { badge: string; title: string; highlight: string; description: string; primaryButton: string; secondaryButton: string };
  features: Array<{ title: string; description: string }>;
  sections: { categories: boolean; featured: boolean };
};

export const DEFAULT_SITE_DESIGN: SiteDesign = {
  colors: { primary: '#023824', accent: '#D4AF37', background: '#FDFBF7', text: '#1F2937' },
  hero: {
    badge: 'Bismillah-ir-Rahman-ir-Rahim',
    title: 'Premium Islamic Essentials & Complete',
    highlight: 'Umrah Supplies',
    description: 'Order original towel Ihrams, non-alcoholic Arabic fragrance oils, organic Sidr honey, and high-density Janamaz with cash on delivery across Pakistan.',
    primaryButton: 'Shop Now',
    secondaryButton: 'View Ihram Collection'
  },
  features: [
    { title: 'Cash on Delivery', description: 'Delivered across all Pakistan' },
    { title: '100% Original Guarantee', description: 'Authentic Sunnah products' },
    { title: 'Easy Exchange', description: '7 Days Hassle-free Policy' },
    { title: 'Best Quality & Rates', description: 'Direct physical store prices' }
  ],
  sections: { categories: true, featured: true }
};

export function normalizeSiteDesign(value: unknown): SiteDesign {
  const source = value && typeof value === 'object' ? value as Record<string, any> : {};
  const base = DEFAULT_SITE_DESIGN;
  const color = (v: unknown, fallback: string) =>
    typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
  const text = (v: unknown, fallback: string, max = 500) =>
    typeof v === 'string' ? v.trim().slice(0, max) : fallback;
  const features = Array.isArray(source.features) ? source.features.slice(0, 8) : base.features;
  return {
    colors: {
      primary: color(source.colors?.primary, base.colors.primary),
      accent: color(source.colors?.accent, base.colors.accent),
      background: color(source.colors?.background, base.colors.background),
      text: color(source.colors?.text, base.colors.text)
    },
    hero: {
      badge: text(source.hero?.badge, base.hero.badge, 100),
      title: text(source.hero?.title, base.hero.title, 180),
      highlight: text(source.hero?.highlight, base.hero.highlight, 100),
      description: text(source.hero?.description, base.hero.description, 600),
      primaryButton: text(source.hero?.primaryButton, base.hero.primaryButton, 50),
      secondaryButton: text(source.hero?.secondaryButton, base.hero.secondaryButton, 80)
    },
    features: features.map((item: any) => ({ title: text(item?.title, '', 80), description: text(item?.description, '', 120) })),
    sections: {
      categories: typeof source.sections?.categories === 'boolean' ? source.sections.categories : true,
      featured: typeof source.sections?.featured === 'boolean' ? source.sections.featured : true
    }
  };
}
