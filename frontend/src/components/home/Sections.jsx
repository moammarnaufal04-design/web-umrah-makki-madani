import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Quote } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { publicApi } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import { SectionHeading } from "@/components/public/SectionHeading";
import { TestimonialCard } from "@/components/public/TestimonialCard";
import { ArticleCard } from "@/components/public/ArticleCard";

export function WhyUs({ section }) {
  const items = section.content?.items || [];
  return (
    <section className="section-mm bg-secondary/40 dark:bg-secondary/20" data-testid="home-section-why-us">
      <div className="container-mm grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4"><SectionHeading eyebrow="Kenapa Kami" title={section.title} subtitle={section.subtitle} className="mb-0" /></div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
          {items.map((it, i) => {
            const Icon = Icons[it.icon] || Icons.Sparkles;
            return (
              <li key={i} className="card-mm flex gap-4 p-6 hover:shadow-card">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30"><Icon className="h-5 w-5" /></span>
                <div><h3 className="font-sans text-base font-bold">{it.title}</h3><p className="mt-1.5 text-sm text-muted-foreground">{it.description}</p></div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Promo({ section }) {
  const c = section.content || {};
  return (
    <section className="container-mm section-mm !pb-0" data-testid="home-section-promo">
      <div className="relative overflow-hidden rounded-[2rem] bg-navy-900 text-white">
        {c.image_url && <img src={c.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/80 to-transparent" />
        <div className="relative grid gap-6 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            {c.badge && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">{c.badge}</span>}
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl lg:text-4xl">{section.title}</h2>
            {section.subtitle && <p className="mt-3 max-w-lg text-sm text-slate-300 md:text-base">{section.subtitle}</p>}
            {c.cta_label && <Link to={c.cta_link || "/packages"} className="btn-gold mt-6" data-testid="promo-cta">{c.cta_label} <ArrowRight className="h-4 w-4" /></Link>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Pembimbing({ section }) {
  const people = section.content?.people || [];
  if (!people.length) return null;
  return (
    <section className="section-mm" data-testid="home-section-pembimbing">
      <div className="container-mm">
        <SectionHeading eyebrow="Pendamping Ibadah" title={section.title} subtitle={section.subtitle} />
        <div className="grid gap-6 lg:grid-cols-2">
          {people.map((p, i) => (
            <article key={i} className="card-mm grid gap-6 p-6 sm:grid-cols-[160px_1fr] sm:p-8" data-testid={`pembimbing-card-${i}`}>
              <div className="aspect-square overflow-hidden rounded-2xl bg-primary/10">
                {p.photo_url ? <img src={p.photo_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-serif text-5xl font-semibold text-primary">{(p.name || "?").replace(/^(Abi|Ummi)\s+/i, "").charAt(0)}</div>}
              </div>
              <div>
                <h3 className="font-sans text-lg font-bold">{p.name}</h3>
                {p.title && <p className="text-sm font-medium text-primary">{p.title}</p>}
                {p.lines?.length > 0 && <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{p.lines.map((l, j) => <li key={j} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />{l}</li>)}</ul>}
                {p.quote && <blockquote className="mt-4 flex gap-2 border-l-2 border-accent pl-3 font-serif text-base italic text-foreground/80"><Quote className="h-4 w-4 shrink-0 text-accent" />{p.quote}</blockquote>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials({ section }) {
  const { data = [] } = useQuery({ queryKey: ["testimonials"], queryFn: async () => (await publicApi.get("/testimonials")).data });
  if (!data.length) return null;
  return (
    <section className="section-mm bg-secondary/40 dark:bg-secondary/20" data-testid="home-section-testimonials">
      <div className="container-mm">
        <SectionHeading eyebrow="Testimoni" title={section.title} subtitle={section.subtitle} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{data.slice(0, 6).map((t) => <TestimonialCard key={t.id} t={t} />)}</div>
      </div>
    </section>
  );
}

export function ArticlesPreview({ section }) {
  const limit = section.content?.limit || 3;
  const { data } = useQuery({ queryKey: ["home-articles", limit], queryFn: async () => (await publicApi.get("/articles", { params: { limit } })).data });
  const items = data?.items || [];
  if (!items.length) return null;
  return (
    <section className="section-mm" data-testid="home-section-articles">
      <div className="container-mm">
        <SectionHeading eyebrow="Wawasan" title={section.title} subtitle={section.subtitle} action={<Link to="/articles" className="btn-outline shrink-0">Semua artikel <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
      </div>
    </section>
  );
}

export function FaqSection({ section, faqs: provided }) {
  const { data = [] } = useQuery({ queryKey: ["faqs"], queryFn: async () => (await publicApi.get("/faqs")).data, enabled: !provided });
  const faqs = provided || data;
  if (!faqs.length) return null;
  return (
    <section className="section-mm" data-testid="home-section-faq">
      <div className="container-mm grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow="FAQ" title={section.title} subtitle={section.subtitle} className="mb-4" />
          <Link to="/faq" className="text-sm font-semibold text-primary hover:underline">Lihat semua pertanyaan →</Link>
        </div>
        <Accordion type="single" collapsible className="lg:col-span-8">
          {faqs.slice(0, 6).map((f) => (
            <AccordionItem key={f.id} value={f.id} className="border-b border-border/70" data-testid={`faq-item-${f.id}`}>
              <AccordionTrigger className="py-5 text-left font-sans text-base font-semibold hover:no-underline">{f.question}</AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function CtaSection({ section }) {
  const { waUrl } = useSite();
  const c = section.content || {};
  return (
    <section className="container-mm section-mm !pb-0" data-testid="home-section-cta">
      <div className="grain relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
        {c.image_url && <img src={c.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />}
        <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center lg:p-16">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">{section.title}</h2>
            {section.subtitle && <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">{section.subtitle}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-pill bg-white text-primary shadow-lg hover:-translate-y-0.5" data-testid="cta-whatsapp"><MessageCircle className="h-4 w-4" />{c.primary_cta_label || "Konsultasi Sekarang"}</a>
            <Link to="/packages" className="btn-pill border border-white/40 text-white hover:bg-white/10" data-testid="cta-packages">{c.secondary_cta_label || "Lihat Paket"}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
