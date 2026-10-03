import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { publicApi } from "@/lib/api";
import { PackageCard } from "@/components/public/PackageCard";
import { SectionHeading } from "@/components/public/SectionHeading";
import { CardGridSkeleton } from "@/components/public/Skeletons";
import { EmptyState } from "@/components/public/States";
import { GROUP_LABEL } from "@/lib/format";

export function PackageSection({ section }) {
  const group = section.content?.group || section.key.toUpperCase();
  const limit = section.content?.limit || 6;
  const { data, isLoading } = useQuery({ queryKey: ["home-packages", group, limit], queryFn: async () => (await publicApi.get("/packages", { params: { group, limit } })).data });
  const items = data?.items || [];
  if (!isLoading && items.length === 0) return null;
  return (
    <section className="section-mm" data-testid={`home-section-${section.key}`}>
      <div className="container-mm">
        <SectionHeading eyebrow={GROUP_LABEL[group]} title={section.title} subtitle={section.subtitle} action={<Link to={`/packages/${group.toLowerCase()}`} className="btn-outline shrink-0" data-testid={`home-section-${section.key}-more`}>Lihat semua <ArrowRight className="h-4 w-4" /></Link>} />
        {isLoading ? <CardGridSkeleton count={Math.min(limit, 3)} /> : items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((p, i) => <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}><PackageCard pkg={p} /></div>)}</div>
        ) : <EmptyState title="Belum ada paket" />}
      </div>
    </section>
  );
}
