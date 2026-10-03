import { Quote, Star } from "lucide-react";

export function TestimonialCard({ t }) {
  return (
    <figure data-testid={`testimonial-${t.id}`} className="card-mm relative flex h-full flex-col p-6 sm:p-8">
      <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/10" />
      <div className="flex gap-0.5 text-gold-500">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90 sm:text-base">“{t.content}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
          {t.avatar_url ? <img src={t.avatar_url} alt={t.name} className="h-full w-full object-cover" loading="lazy" /> : (t.name || "?").charAt(0)}
        </div>
        <div>
          <div className="text-sm font-semibold">{t.name}</div>
          <div className="text-xs text-muted-foreground">{[t.origin, t.package_label].filter(Boolean).join(" · ")}</div>
        </div>
        {t.is_placeholder && <span className="ml-auto rounded-full border border-dashed border-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">Contoh</span>}
      </figcaption>
    </figure>
  );
}
