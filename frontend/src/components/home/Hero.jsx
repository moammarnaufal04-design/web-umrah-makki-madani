import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import * as Icons from "lucide-react";
import { useSite } from "@/context/SiteContext";

export function Hero({ section }) {
  const { waUrl, brand } = useSite();
  const c = section.content || {};
  const highlights = c.highlights || [];
  return (
    <section className="relative overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,118,110,0.10),_transparent_55%)]" />
      <div className="container-mm grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-6">
          {c.badge && <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><ShieldCheck className="h-3.5 w-3.5" />{c.badge}</span>}
          <h1 className="animate-fade-up delay-1 mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl" data-testid="hero-title">{section.title || brand.tagline}</h1>
          {section.subtitle && <p className="animate-fade-up delay-2 mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg" data-testid="hero-subtitle">{section.subtitle}</p>}
          <div className="animate-fade-up delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary" data-testid="hero-primary-cta">{c.primary_cta_label || "Konsultasi Sekarang"} <ArrowRight className="h-4 w-4" /></a>
            <Link to={c.secondary_cta_link || "/packages"} className="btn-outline" data-testid="hero-secondary-cta">{c.secondary_cta_label || "Lihat Paket"}</Link>
          </div>
          {highlights.length > 0 && (
            <ul className="animate-fade-up delay-4 mt-10 grid gap-4 sm:grid-cols-3">
              {highlights.map((h, i) => {
                const Icon = Icons[h.icon] || [Icons.UserCheck, Icons.MapPin, Icons.HeartHandshake][i % 3];
                return (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                    <div><div className="text-sm font-semibold">{h.title}</div><div className="text-xs text-muted-foreground">{h.description}</div></div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="relative lg:col-span-6">
          <div className="absolute -right-4 -top-4 h-full w-full rounded-[2rem] border border-accent/40 lg:-right-6 lg:-top-6" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted shadow-soft sm:aspect-[5/4] lg:aspect-[4/5]">
            {c.image_url ? <img src={c.image_url} alt={section.title || "Makki Madani"} className="h-full w-full object-cover" fetchpriority="high" /> : <div className="flex h-full items-center justify-center text-muted-foreground">Gambar hero belum diatur</div>}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-900/70 to-transparent p-6 text-white">
              <div className="text-xs uppercase tracking-[0.2em] text-white/80">{brand.legal_name}</div>
              <div className="mt-1 font-serif text-lg">{brand.tagline}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
