import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { publicApi } from "@/lib/api";
import { useSeo, breadcrumbSchema } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ArticleCard } from "@/components/public/ArticleCard";
import { EmptyState, ErrorState } from "@/components/public/States";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Articles() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const tag = params.get("tag") || "";
  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["articles", category, tag, q, page], queryFn: async () => (await publicApi.get("/articles", { params: { category: category || undefined, tag: tag || undefined, q: q || undefined, page, limit: 9 } })).data });
  const { data: cats = [] } = useQuery({ queryKey: ["article-categories"], queryFn: async () => (await publicApi.get("/article-categories")).data });
  useSeo({ title: "Artikel & Panduan Umrah, Haji, dan Travel", description: "Panduan persiapan umrah dan haji, tips memilih travel, hotel, dan maskapai dari Makki Madani Tour & Travel.", path: "/articles", jsonLd: breadcrumbSchema([{ label: "Artikel", href: "/articles" }]) });
  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); if (!("page" in patch)) next.delete("page"); setParams(next); };
  const items = data?.items || [];

  return (
    <div className="container-mm py-10 sm:py-14" data-testid="articles-page">
      <Breadcrumbs items={[{ label: "Artikel" }]} />
      <div className="mt-6 max-w-2xl"><div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow">Wawasan</span></div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Artikel & Panduan</h1><p className="mt-3 text-base text-muted-foreground md:text-lg">Bekal pengetahuan sebelum berangkat ke Tanah Suci dan tips memilih perjalanan yang tepat.</p></div>
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => update({ category: "", tag: "" })} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold", !category && !tag ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-primary")}>Semua</button>
          {cats.map((c) => <button key={c.id} onClick={() => update({ category: c.slug, tag: "" })} data-testid={`article-category-${c.slug}`} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold", category === c.slug ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-primary")}>{c.name} <span className="opacity-60">({c.article_count})</span></button>)}
          {tag && <span className="shrink-0 rounded-full border border-accent bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">#{tag}</span>}
        </div>
        <div className="relative md:w-72"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input key={q} defaultValue={q} onKeyDown={(e) => e.key === "Enter" && update({ q: e.currentTarget.value })} placeholder="Cari artikel…" data-testid="articles-search-input" className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm focus:border-primary focus:outline-none" /></div>
      </div>
      <div className="mt-8">
        {isLoading ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="loading-skeleton">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div> : isError ? <ErrorState onRetry={refetch} /> : items.length === 0 ? <EmptyState title="Artikel belum tersedia" description="Konten sedang disiapkan. Silakan kembali lagi nanti." /> : (
          <>
            {page === 1 && !q && !category && !tag && items[0] && <div className="mb-6"><ArticleCard article={items[0]} featured /></div>}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{(page === 1 && !q && !category && !tag ? items.slice(1) : items).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
            {data.pages > 1 && <nav className="mt-10 flex justify-center gap-2" data-testid="articles-pagination">{Array.from({ length: data.pages }).map((_, i) => <button key={i} onClick={() => update({ page: String(i + 1) })} className={cn("h-10 w-10 rounded-full border text-sm font-semibold", page === i + 1 ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}>{i + 1}</button>)}</nav>}
          </>
        )}
      </div>
    </div>
  );
}
