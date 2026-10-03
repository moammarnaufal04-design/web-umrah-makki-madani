import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch as SearchIcon, SlidersHorizontal } from "lucide-react";
import { publicApi } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import { useSeo, breadcrumbSchema } from "@/hooks/useSeo";
import { PackageCard } from "@/components/public/PackageCard";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CardGridSkeleton } from "@/components/public/Skeletons";
import { EmptyState, ErrorState } from "@/components/public/States";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GROUP_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const monthLabel = (ym) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(ym + "-01T00:00:00"));

const COPY = {
  ALL: { title: "Semua Paket Perjalanan", desc: "Pilihan paket Umrah, Haji, dan Wisata Halal dari Makki Madani Tour & Travel untuk jamaah Aceh, Jakarta, dan seluruh Indonesia." },
  UMRAH: { title: "Paket Umrah", desc: "Paket umrah dari Banda Aceh dan Jakarta dengan pendampingan ibadah, hotel terpilih, dan muthawwif berpengalaman." },
  HAJI: { title: "Paket Haji", desc: "Program Haji Khusus dan Haji Plus dengan bimbingan manasik dan pendampingan menyeluruh." },
  WISATA: { title: "Wisata Halal", desc: "Perjalanan wisata halal ke Turki, Dubai, Aceh, dan destinasi pilihan lainnya." },
};

export default function Packages({ group = "ALL" }) {
  const [params, setParams] = useSearchParams();
  const { categoriesByGroup, categories } = useSite();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const month = params.get("month") || "";
  const sort = params.get("sort") || "departure_asc";
  const page = Number(params.get("page") || 1);
  const query = useMemo(() => ({ group: group === "ALL" ? undefined : group, q: q || undefined, category: category || undefined, month: month || undefined, sort, page, limit: 12 }), [group, q, category, month, sort, page]);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["packages", query], queryFn: async () => (await publicApi.get("/packages", { params: query })).data, keepPreviousData: true });
  const { data: months = [] } = useQuery({ queryKey: ["package-months"], queryFn: async () => (await publicApi.get("/packages/months")).data });
  const cats = group === "ALL" ? categories : categoriesByGroup(group);
  const copy = COPY[group];
  const path = group === "ALL" ? "/packages" : `/packages/${group.toLowerCase()}`;
  useSeo({ title: copy.title, description: copy.desc, path, jsonLd: breadcrumbSchema([{ label: "Paket", href: "/packages" }, ...(group !== "ALL" ? [{ label: GROUP_LABEL[group], href: path }] : [])]) });

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    setParams(next);
  };

  return (
    <div className="container-mm py-10 sm:py-14" data-testid="packages-page">
      <Breadcrumbs items={[{ label: "Paket", href: "/packages" }, ...(group !== "ALL" ? [{ label: GROUP_LABEL[group] }] : [])]} />
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow">{group === "ALL" ? "Katalog" : GROUP_LABEL[group]}</span></div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl" data-testid="packages-title">{copy.title}</h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">{copy.desc}</p>
        </div>
        <div className="flex gap-2 text-sm">
          {["ALL", "UMRAH", "HAJI", "WISATA"].map((g) => (
            <a key={g} href={g === "ALL" ? "/packages" : `/packages/${g.toLowerCase()}`} data-testid={`packages-group-${g.toLowerCase()}`} className={cn("rounded-full border px-4 py-2 font-medium transition-colors", g === group ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary")}>{g === "ALL" ? "Semua" : GROUP_LABEL[g]}</a>
          ))}
        </div>
      </div>

      <div className="card-mm mt-8 grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_1fr]" data-testid="packages-filters">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input defaultValue={q} key={q} onKeyDown={(e) => e.key === "Enter" && update({ q: e.currentTarget.value })} onBlur={(e) => e.target.value !== q && update({ q: e.target.value })} placeholder="Cari nama paket, maskapai…" data-testid="packages-search-input" className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm focus:border-primary focus:outline-none" />
        </div>
        <Select value={month || "ALL"} onValueChange={(v) => update({ month: v === "ALL" ? "" : v })}>
          <SelectTrigger className="h-11 rounded-xl" data-testid="packages-month-filter"><SelectValue placeholder="Bulan" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">Semua bulan keberangkatan</SelectItem>{months.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-11 rounded-xl" data-testid="packages-sort"><SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="departure_asc">Keberangkatan terdekat</SelectItem>
            <SelectItem value="price_asc">Harga terendah</SelectItem>
            <SelectItem value="price_desc">Harga tertinggi</SelectItem>
            <SelectItem value="newest">Terbaru</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cats.length > 0 && (
        <div className="scrollbar-thin mt-4 flex gap-2 overflow-x-auto pb-2" data-testid="packages-category-chips">
          <button onClick={() => update({ category: "" })} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold", !category ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-primary")}>Semua kategori</button>
          {cats.map((c) => <button key={c.id} onClick={() => update({ category: c.slug })} data-testid={`category-chip-${c.slug}`} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold", category === c.slug ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-primary")}>{c.name}</button>)}
        </div>
      )}

      <div className="mt-8">
        {isLoading ? <CardGridSkeleton count={6} /> : isError ? <ErrorState onRetry={refetch} /> : data.items.length === 0 ? (
          <EmptyState title="Paket tidak ditemukan" description="Coba ubah kata kunci atau filter. Anda juga dapat berkonsultasi langsung untuk paket custom." testId="packages-empty" />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground" data-testid="packages-count">Menampilkan {data.items.length} dari {data.total} paket</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((p) => <PackageCard key={p.id} pkg={p} />)}</div>
            {data.pages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" data-testid="packages-pagination">
                {Array.from({ length: data.pages }).map((_, i) => (
                  <button key={i} onClick={() => update({ page: String(i + 1) })} className={cn("h-10 w-10 rounded-full border text-sm font-semibold", page === i + 1 ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}>{i + 1}</button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
