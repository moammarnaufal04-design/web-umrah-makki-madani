import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MessageCircle, Tag, UserRound } from "lucide-react";
import { publicApi } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import { useSeo, breadcrumbSchema } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ArticleCard } from "@/components/public/ArticleCard";
import { ErrorState } from "@/components/public/States";
import { TextSkeleton } from "@/components/public/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import NotFound from "@/pages/public/NotFound";

export default function ArticleDetail() {
  const { slug } = useParams();
  const { waUrl, settings } = useSite();
  const { data: a, isLoading, isError, error, refetch } = useQuery({ queryKey: ["article", slug], queryFn: async () => (await publicApi.get(`/articles/${slug}`)).data, retry: false });
  useSeo(a ? {
    title: a.seo_title || a.title, description: a.seo_description || a.excerpt, path: `/articles/${a.slug}`, image: a.featured_image_url, type: "article",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.excerpt, image: a.featured_image_url, datePublished: a.published_at, dateModified: a.updated_at, author: { "@type": "Organization", name: a.author_name || settings.brand?.name }, publisher: { "@type": "Organization", name: settings.brand?.name, logo: settings.brand?.logo_url ? { "@type": "ImageObject", url: settings.brand.logo_url } : undefined }, mainEntityOfPage: window.location.href },
      breadcrumbSchema([{ label: "Artikel", href: "/articles" }, ...(a.category ? [{ label: a.category.name, href: `/articles?category=${a.category.slug}` }] : []), { label: a.title }]),
    ],
  } : { title: "Memuat artikel…", path: `/articles/${slug}` });

  if (isLoading) return <div className="container-mm max-w-3xl py-12" data-testid="article-loading"><Skeleton className="h-4 w-56" /><Skeleton className="mt-6 h-12 w-full" /><Skeleton className="mt-2 h-12 w-2/3" /><Skeleton className="mt-8 aspect-[16/9] rounded-2xl" /><div className="mt-8"><TextSkeleton lines={8} /></div></div>;
  if (isError) return error?.response?.status === 404 ? <NotFound /> : <div className="container-mm py-20"><ErrorState onRetry={refetch} /></div>;

  return (
    <article className="py-10 sm:py-14" data-testid="article-detail-page">
      <div className="container-mm max-w-3xl">
        <Breadcrumbs items={[{ label: "Artikel", href: "/articles" }, ...(a.category ? [{ label: a.category.name, href: `/articles?category=${a.category.slug}` }] : []), { label: a.title }]} />
        {a.category && <Link to={`/articles?category=${a.category.slug}`} className="eyebrow mt-6 inline-block">{a.category.name}</Link>}
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl" data-testid="article-title">{a.title}</h1>
        {a.excerpt && <p className="mt-4 text-base text-muted-foreground md:text-lg">{a.excerpt}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4" />{a.author_name || settings.brand?.name}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(a.published_at)}</span>
        </div>
      </div>
      {a.featured_image_url && <div className="container-mm mt-8 max-w-4xl"><img src={a.featured_image_url} alt={a.title} className="aspect-[16/9] w-full rounded-[2rem] object-cover shadow-soft" /></div>}
      <div className="container-mm mt-10 max-w-3xl">
        <div className="prose-mm" data-testid="article-content" dangerouslySetInnerHTML={{ __html: a.content || "" }} />
        {a.sources?.length > 0 && (
          <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-5 text-sm" data-testid="article-sources">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">Referensi</h2>
            <ul className="mt-2 space-y-1">{a.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{s.label || s.url}</a> : <span className="text-muted-foreground">{s.label}</span>}</li>)}</ul>
          </div>
        )}
        {a.tags?.length > 0 && <div className="mt-8 flex flex-wrap items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" />{a.tags.map((t) => <Link key={t.id} to={`/articles?tag=${t.slug}`} className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary">#{t.name}</Link>)}</div>}
        <div className="mt-12 rounded-[2rem] bg-primary p-8 text-primary-foreground">
          <h2 className="text-2xl font-semibold">Butuh bantuan merencanakan perjalanan?</h2>
          <p className="mt-2 text-sm text-white/85">Tim Makki Madani siap membantu memilih paket Umrah, Haji, atau Wisata Halal yang sesuai.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row"><a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-pill bg-white text-primary"><MessageCircle className="h-4 w-4" /> Konsultasi Sekarang</a><Link to="/packages" className="btn-pill border border-white/40 text-white hover:bg-white/10">Lihat Paket</Link></div>
        </div>
      </div>
      {a.related?.length > 0 && <div className="container-mm mt-16"><h2 className="mb-6 text-2xl font-semibold">Artikel Terkait</h2><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{a.related.map((r) => <ArticleCard key={r.id} article={r} />)}</div></div>}
    </article>
  );
}
