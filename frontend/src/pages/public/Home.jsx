import { useSite } from "@/context/SiteContext";
import { useSeo, organizationSchema } from "@/hooks/useSeo";
import { Hero } from "@/components/home/Hero";
import { PackageSearch } from "@/components/home/PackageSearch";
import { PackageSection } from "@/components/home/PackageSection";
import { ArticlesPreview, CtaSection, FaqSection, Pembimbing, Promo, Testimonials, WhyUs } from "@/components/home/Sections";
import { Skeleton } from "@/components/ui/skeleton";

const RENDERERS = { hero: Hero, search: PackageSearch, umrah: PackageSection, haji: PackageSection, wisata: PackageSection, why_us: WhyUs, promo: Promo, pembimbing: Pembimbing, testimonials: Testimonials, articles: ArticlesPreview, faq: FaqSection, cta: CtaSection };

export default function Home() {
  const { sections, loading, settings } = useSite();
  useSeo({ path: "/", jsonLd: organizationSchema(settings) });
  if (loading) {
    return (
      <div className="container-mm grid gap-10 py-20 lg:grid-cols-2" data-testid="home-loading">
        <div className="space-y-5"><Skeleton className="h-6 w-40" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-4/5" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-12 w-60" /></div>
        <Skeleton className="aspect-[4/5] rounded-[2rem]" />
      </div>
    );
  }
  return (
    <div data-testid="home-page">
      {sections.filter((s) => s.is_active).map((s) => {
        const Comp = RENDERERS[s.key];
        return Comp ? <Comp key={s.id} section={s} /> : null;
      })}
    </div>
  );
}
