import { Link } from "react-router-dom";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article, featured = false }) {
  return (
    <article data-testid={`article-card-${article.slug}`} className={`card-mm group flex flex-col overflow-hidden hover:shadow-card ${featured ? "md:flex-row" : ""}`}>
      <Link to={`/articles/${article.slug}`} className={`relative block overflow-hidden bg-muted ${featured ? "aspect-[4/3] md:w-1/2" : "aspect-[16/10]"}`}>
        {article.featured_image_url && <img src={article.featured_image_url} alt={article.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
        {article.category && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary shadow">{article.category.name}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{formatDate(article.published_at)}</div>
        <h3 className={`mt-2 font-sans font-bold leading-snug text-foreground ${featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>
          <Link to={`/articles/${article.slug}`} className="hover:text-primary">{article.title}</Link>
        </h3>
        {article.excerpt && <p className={`mt-2 text-sm text-muted-foreground ${featured ? "line-clamp-4" : "line-clamp-3"}`}>{article.excerpt}</p>}
        <Link to={`/articles/${article.slug}`} className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary hover:gap-2 transition-all">Baca selengkapnya <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}
