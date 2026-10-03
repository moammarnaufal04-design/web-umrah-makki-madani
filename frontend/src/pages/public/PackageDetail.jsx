import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, CalendarDays, Check, Clock, Download, FileText, MapPin, MessageCircle, Plane, PlaneLanding, PlaneTakeoff, Quote, Share2, Star, Users, X, Images } from "lucide-react";
import { publicApi } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import { useSeo, breadcrumbSchema, faqSchema } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { StatusBadge } from "@/components/public/StatusBadge";
import { PackageCard } from "@/components/public/PackageCard";
import { RegistrationModal } from "@/components/public/RegistrationModal";
import { ErrorState } from "@/components/public/States";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PACKAGE_STATUS, formatDate, formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import NotFound from "@/pages/public/NotFound";

const Section = ({ id, title, children, className = "" }) => (
  <section id={id} className={`scroll-mt-28 border-t border-border/70 py-8 first:border-t-0 ${className}`} data-testid={`package-section-${id}`}>
    <h2 className="mb-4 font-sans text-lg font-bold sm:text-xl">{title}</h2>
    {children}
  </section>
);

const Fact = ({ icon: Icon, label, value, testId }) => (
  <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5" data-testid={testId}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
    <div className="min-w-0"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="truncate text-sm font-semibold">{value || "-"}</div></div>
  </div>
);

const Stars = ({ n }) => (n ? <span className="inline-flex gap-0.5 text-gold-500">{Array.from({ length: n }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</span> : null);

const HotelCard = ({ title, name, rating, distance, testId }) => (
  <div className="card-mm p-5" data-testid={testId}>
    <div className="eyebrow">{title}</div>
    <div className="mt-2 flex items-center gap-2"><BedDouble className="h-5 w-5 text-primary" /><span className="font-semibold">{name || "Diinformasikan kemudian"}</span></div>
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><Stars n={rating} />{distance && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{distance}</span>}</div>
  </div>
);

export default function PackageDetail() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { waUrl, settings } = useSite();
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const { data: pkg, isLoading, isError, error, refetch } = useQuery({ queryKey: ["package", slug], queryFn: async () => (await publicApi.get(`/packages/${slug}`)).data, retry: false });

  useEffect(() => {
    if (pkg && params.get("daftar") === "1") {
      setOpen(true);
      const next = new URLSearchParams(params);
      next.delete("daftar");
      setParams(next, { replace: true });
    }
  }, [pkg]); // eslint-disable-line react-hooks/exhaustive-deps

  const img = pkg?.hero_image_url || pkg?.flyer_url;
  useSeo(pkg ? {
    title: pkg.seo_title || pkg.name,
    description: pkg.seo_description || pkg.short_description || `${pkg.name} — keberangkatan ${formatDate(pkg.departure_date)}, ${pkg.duration_days} hari.`,
    path: `/packages/${pkg.slug}`,
    image: img,
    type: "product",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "TouristTrip", name: pkg.name, description: pkg.short_description, image: img, touristType: pkg.category?.group_type, provider: { "@type": "TravelAgency", name: settings.brand?.name }, offers: Number(pkg.price) > 0 ? { "@type": "Offer", price: Number(pkg.price), priceCurrency: "IDR", availability: ["FULL", "SOLD_OUT", "CLOSED"].includes(pkg.public_status) ? "https://schema.org/SoldOut" : "https://schema.org/InStock" } : undefined, itinerary: pkg.itineraries?.length ? { "@type": "ItemList", itemListElement: pkg.itineraries.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: `Hari ${it.day_number}: ${it.title}` })) } : undefined },
      breadcrumbSchema([{ label: "Paket", href: "/packages" }, { label: pkg.category?.name, href: `/packages/${pkg.category?.group_type?.toLowerCase()}` }, { label: pkg.name }]),
      ...(pkg.faqs?.length ? [faqSchema(pkg.faqs)] : []),
    ],
  } : { title: "Memuat paket…", path: `/packages/${slug}` });

  if (isLoading) {
    return (
      <div className="container-mm py-12" data-testid="package-detail-loading">
        <Skeleton className="h-4 w-64" />
        <div className="mt-8 grid gap-10 lg:grid-cols-12"><Skeleton className="aspect-[4/5] rounded-[2rem] lg:col-span-5" /><div className="space-y-4 lg:col-span-7"><Skeleton className="h-5 w-32" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-64" /></div></div>
      </div>
    );
  }
  if (isError) return error?.response?.status === 404 ? <NotFound /> : <div className="container-mm py-20"><ErrorState onRetry={refetch} /></div>;

  const canRegister = !["FULL", "CLOSED", "SOLD_OUT"].includes(pkg.public_status);
  const pct = pkg.total_seats ? Math.min(100, Math.round((pkg.seats_filled / pkg.total_seats) * 100)) : 0;
  const companion = pkg.companions?.[0];
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: pkg.name, url }); } catch { /* cancelled */ } }
    else { await navigator.clipboard.writeText(url); toast.success("Tautan disalin"); }
  };
  const anchors = [["overview", "Program"], companion && ["pendamping", "Pendamping"], ["keberangkatan", "Keberangkatan"], ["hotel", "Hotel"], ["fasilitas", "Fasilitas"], pkg.itineraries?.length && ["itinerary", "Itinerary"], pkg.gallery?.length && ["gallery", "Galeri"], pkg.faqs?.length && ["faq", "FAQ"]].filter(Boolean);

  return (
    <div data-testid="package-detail-page">
      <div className="container-mm pt-8 sm:pt-10">
        <Breadcrumbs items={[{ label: "Paket", href: "/packages" }, { label: pkg.category?.name || "Kategori", href: `/packages/${pkg.category?.group_type?.toLowerCase()}?category=${pkg.category?.slug}` }, { label: pkg.name }]} />
        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted shadow-soft">
              {img ? <img src={img} alt={pkg.name} className="h-full w-full object-cover" data-testid="package-hero-image" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Plane className="h-12 w-12" /></div>}
              <div className="absolute left-4 top-4 flex gap-2"><StatusBadge status={pkg.public_status} map={PACKAGE_STATUS} size="md" className="shadow" testId="package-status-badge" />{pkg.is_featured && <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 shadow">Unggulan</span>}</div>
              {pkg.flyer_url && <a href={pkg.flyer_url} target="_blank" rel="noopener noreferrer" download className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-primary shadow backdrop-blur hover:bg-white" data-testid="package-download-flyer"><Download className="h-3.5 w-3.5" /> Unduh Flyer</a>}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3"><span className="gold-line" /><span className="eyebrow">{pkg.category?.name}</span>{pkg.product_type && <span className="text-xs text-muted-foreground">· {pkg.product_type}</span>}</div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl" data-testid="package-title">{pkg.name}</h1>
            {pkg.short_description && <p className="mt-4 text-base text-muted-foreground md:text-lg">{pkg.short_description}</p>}
            <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div><div className="text-xs uppercase tracking-wider text-muted-foreground">Harga per jamaah</div><div className="font-serif text-3xl font-semibold text-primary sm:text-4xl" data-testid="package-price">{Number(pkg.price) > 0 ? formatRupiah(pkg.price) : "Hubungi Kami"}</div></div>
              {Number(pkg.dp_amount) > 0 && <div className="text-sm text-muted-foreground">DP {formatRupiah(pkg.dp_amount)}</div>}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact icon={CalendarDays} label="Keberangkatan" value={pkg.departure_date ? formatDate(pkg.departure_date) : "Menyusul"} testId="package-fact-departure" />
              <Fact icon={Clock} label="Durasi" value={pkg.duration_days ? `${pkg.duration_days} Hari` : "-"} testId="package-fact-duration" />
              <Fact icon={Plane} label="Maskapai" value={pkg.airline} testId="package-fact-airline" />
              <Fact icon={Users} label="Kuota" value={`${pkg.remaining_seats} dari ${pkg.total_seats} kursi`} testId="package-fact-quota" />
            </div>
            <div className="mt-3"><div className="flex justify-between text-xs text-muted-foreground"><span>Kursi terisi {pkg.seats_filled}</span><span>{pct}%</span></div><div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div></div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {canRegister ? <button onClick={() => setOpen(true)} className="btn-primary flex-1 sm:flex-none" data-testid="package-register-button">{pkg.booking_cta_label || "Daftar Paket"}</button> : <span className="btn-pill cursor-not-allowed bg-muted text-muted-foreground" data-testid="package-register-disabled">Pendaftaran {PACKAGE_STATUS[pkg.public_status]?.label}</span>}
              <a href={pkg.whatsapp_url || waUrl()} target="_blank" rel="noopener noreferrer" className="btn-wa" data-testid="package-whatsapp-button"><MessageCircle className="h-4 w-4" />{pkg.whatsapp_cta_label || "Konsultasi WhatsApp"}</a>
              <button onClick={share} className="btn-outline" aria-label="Bagikan" data-testid="package-share-button"><Share2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[72px] z-30 mt-10 border-y border-border/70 bg-background/85 backdrop-blur">
        <div className="container-mm scrollbar-thin flex gap-1 overflow-x-auto py-2 text-sm">
          {anchors.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-4 py-2 font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary" data-testid={`package-anchor-${id}`}>{label}</a>)}
        </div>
      </div>

      <div className="container-mm grid gap-12 py-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Section id="overview" title="Program Overview"><p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{pkg.full_description || pkg.short_description}</p>{pkg.extra_cities?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{pkg.extra_cities.map((c) => <span key={c} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"><MapPin className="mr-1 inline h-3 w-3" />{c}</span>)}</div>}</Section>

          {companion && (
            <Section id="pendamping" title="Tokoh Pendamping">
              <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
                <div className="aspect-square overflow-hidden rounded-2xl bg-primary/10">{companion.photo_url ? <img src={companion.photo_url} alt={companion.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-serif text-6xl font-semibold text-primary">{companion.name.replace(/^(Abi|Ummi)\s+/i, "").charAt(0)}</div>}</div>
                <div>
                  <h3 className="font-sans text-xl font-bold" data-testid="package-companion-name">{companion.name}</h3>
                  {companion.title && <p className="text-sm font-medium text-primary">{companion.title}</p>}
                  {companion.bio && <p className="mt-3 text-sm text-muted-foreground">{companion.bio}</p>}
                  {companion.profile_lines?.length > 0 && <><h4 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profil Pembimbing</h4><ul className="mt-2 space-y-1.5">{companion.profile_lines.map((l, i) => <li key={i} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{l}</li>)}</ul></>}
                  {companion.quote && <blockquote className="mt-5 rounded-2xl border-l-4 border-accent bg-accent/5 p-4 font-serif text-lg italic leading-relaxed" data-testid="package-companion-quote"><Quote className="mb-1 h-5 w-5 text-accent" />{companion.quote}</blockquote>}
                </div>
              </div>
            </Section>
          )}

          <Section id="keberangkatan" title="Detail Keberangkatan">
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact icon={PlaneTakeoff} label="Bandara Keberangkatan" value={pkg.departure_airport} />
              <Fact icon={PlaneLanding} label="Bandara Tujuan" value={pkg.arrival_airport} />
              <Fact icon={CalendarDays} label="Tanggal Berangkat" value={pkg.departure_date ? formatDate(pkg.departure_date) : "Menyusul"} />
              <Fact icon={CalendarDays} label="Tanggal Kembali" value={pkg.return_date ? formatDate(pkg.return_date) : "-"} />
            </div>
            <h3 className="mb-3 mt-8 font-sans text-base font-bold">Penerbangan</h3>
            <div className="card-mm flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plane className="h-5 w-5" /></span><div><div className="font-semibold">{pkg.airline || "Diinformasikan kemudian"}</div><div className="text-sm text-muted-foreground">{pkg.route || "-"}</div></div></div>
              {pkg.flight_info && <p className="max-w-md text-sm text-muted-foreground">{pkg.flight_info}</p>}
            </div>
          </Section>

          <Section id="hotel" title="Akomodasi">
            <div className="grid gap-4 sm:grid-cols-2">
              <HotelCard title="Hotel Makkah" name={pkg.makkah_hotel} rating={pkg.makkah_hotel_rating} distance={pkg.makkah_hotel_distance} testId="package-hotel-makkah" />
              <HotelCard title="Hotel Madinah" name={pkg.madinah_hotel} rating={pkg.madinah_hotel_rating} distance={pkg.madinah_hotel_distance} testId="package-hotel-madinah" />
            </div>
            {(pkg.room_type || pkg.other_accommodation) && <p className="mt-4 text-sm text-muted-foreground">{pkg.room_type && <><strong className="text-foreground">Tipe kamar:</strong> {pkg.room_type}. </>}{pkg.other_accommodation}</p>}
          </Section>

          <Section id="fasilitas" title="Fasilitas">
            <div className="grid gap-6 sm:grid-cols-2">
              <div><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">Termasuk</h3><ul className="space-y-2">{pkg.facilities_included.map((f, i) => <li key={i} className="flex gap-2 text-sm" data-testid={`facility-included-${i}`}><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}{!pkg.facilities_included.length && <li className="text-sm text-muted-foreground">-</li>}</ul></div>
              <div><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-700">Tidak Termasuk</h3><ul className="space-y-2">{pkg.facilities_excluded.map((f, i) => <li key={i} className="flex gap-2 text-sm" data-testid={`facility-excluded-${i}`}><X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />{f}</li>)}{!pkg.facilities_excluded.length && <li className="text-sm text-muted-foreground">-</li>}</ul></div>
            </div>
          </Section>

          {pkg.itineraries?.length > 0 && (
            <Section id="itinerary" title="Itinerary">
              {pkg.itinerary_file_url && <a href={pkg.itinerary_file_url} target="_blank" rel="noopener noreferrer" className="btn-outline mb-4 !py-2 text-xs" data-testid="package-download-itinerary"><FileText className="h-4 w-4" /> Unduh Itinerary (PDF)</a>}
              <Accordion type="multiple" className="rounded-2xl border border-border/70 px-5" defaultValue={[pkg.itineraries[0]?.id]}>
                {pkg.itineraries.map((it) => (
                  <AccordionItem key={it.id} value={it.id} className="border-border/70" data-testid={`itinerary-day-${it.day_number}`}>
                    <AccordionTrigger className="py-4 text-left hover:no-underline"><span className="flex items-center gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">H{it.day_number}</span><span className="font-sans font-semibold">{it.title}</span></span></AccordionTrigger>
                    <AccordionContent className="pb-4 pl-13 text-sm leading-relaxed text-muted-foreground sm:pl-[52px]">{it.description || "-"}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Section>
          )}

          {pkg.gallery?.length > 0 && (
            <Section id="gallery" title="Galeri">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pkg.gallery.map((g, i) => <button key={g.id} onClick={() => setLightbox(i)} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted" data-testid={`gallery-item-${i}`}><img src={g.image_url} alt={g.caption || pkg.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />{g.caption && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white">{g.caption}</span>}</button>)}
              </div>
              <Dialog open={lightbox !== null} onOpenChange={() => setLightbox(null)}>
                <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none" data-testid="gallery-lightbox">
                  {lightbox !== null && <img src={pkg.gallery[lightbox].image_url} alt={pkg.gallery[lightbox].caption || ""} className="max-h-[85vh] w-full rounded-2xl object-contain" />}
                </DialogContent>
              </Dialog>
            </Section>
          )}

          {(pkg.notes || pkg.terms || pkg.payment_notes) && (
            <Section id="catatan" title="Catatan & Ketentuan">
              {pkg.payment_notes && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Pembayaran:</strong> {pkg.payment_notes}</p>}
              {pkg.notes && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{pkg.notes}</p>}
              {pkg.terms && <div className="mt-4 rounded-xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Syarat & Ketentuan Paket:</strong> {pkg.terms}</div>}
            </Section>
          )}

          {pkg.faqs?.length > 0 && (
            <Section id="faq" title="FAQ Paket">
              <Accordion type="single" collapsible>{pkg.faqs.map((f) => <AccordionItem key={f.id} value={f.id}><AccordionTrigger className="text-left font-sans font-semibold hover:no-underline">{f.question}</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground">{f.answer}</AccordionContent></AccordionItem>)}</Accordion>
            </Section>
          )}

          <section className="mt-6 rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-10" data-testid="package-booking-cta">
            <h2 className="text-2xl font-semibold sm:text-3xl">Siap bergabung dalam perjalanan ini?</h2>
            <p className="mt-2 text-sm text-white/85 md:text-base">Isi formulir singkat dan tim kami akan menghubungi Anda melalui WhatsApp untuk konsultasi.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">{canRegister && <button onClick={() => setOpen(true)} className="btn-pill bg-white text-primary shadow-lg hover:-translate-y-0.5" data-testid="package-booking-cta-register">Daftar Paket</button>}<a href={pkg.whatsapp_url || waUrl()} target="_blank" rel="noopener noreferrer" className="btn-pill border border-white/40 text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /> Konsultasi WhatsApp</a></div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="card-mm sticky top-32 p-6" data-testid="package-booking-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Harga per jamaah</div>
            <div className="font-serif text-3xl font-semibold text-primary">{Number(pkg.price) > 0 ? formatRupiah(pkg.price) : "Hubungi Kami"}</div>
            {Number(pkg.dp_amount) > 0 && <div className="mt-1 text-sm text-muted-foreground">DP {formatRupiah(pkg.dp_amount)} · Sisa {formatRupiah(Number(pkg.price) - Number(pkg.dp_amount))}</div>}
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={pkg.public_status} map={PACKAGE_STATUS} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Keberangkatan</dt><dd className="font-medium">{pkg.departure_date ? formatDate(pkg.departure_date) : "Menyusul"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Durasi</dt><dd className="font-medium">{pkg.duration_days ? `${pkg.duration_days} Hari` : "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Sisa kursi</dt><dd className="font-medium" data-testid="package-remaining-seats">{pkg.remaining_seats}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Kode paket</dt><dd className="font-mono text-xs">{pkg.code}</dd></div>
            </dl>
            <div className="mt-6 flex flex-col gap-2.5">
              {canRegister && <button onClick={() => setOpen(true)} className="btn-primary w-full" data-testid="package-sidebar-register">Daftar Paket</button>}
              <a href={pkg.whatsapp_url || waUrl()} target="_blank" rel="noopener noreferrer" className="btn-wa w-full"><MessageCircle className="h-4 w-4" /> Konsultasi WhatsApp</a>
              {pkg.flyer_url && <a href={pkg.flyer_url} target="_blank" rel="noopener noreferrer" className="btn-outline w-full !py-2.5 text-xs"><Download className="h-4 w-4" /> Unduh Flyer</a>}
              {pkg.itinerary_file_url && <a href={pkg.itinerary_file_url} target="_blank" rel="noopener noreferrer" className="btn-outline w-full !py-2.5 text-xs"><FileText className="h-4 w-4" /> Unduh Itinerary</a>}
            </div>
          </div>
        </aside>
      </div>

      {pkg.related?.length > 0 && (
        <div className="container-mm section-mm !pt-6">
          <div className="mb-8 flex items-center gap-3"><Images className="h-5 w-5 text-primary" /><h2 className="text-2xl font-semibold">Paket Terkait</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{pkg.related.map((p) => <PackageCard key={p.id} pkg={p} compact />)}</div>
        </div>
      )}

      {canRegister && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden" data-testid="package-mobile-bar">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Harga</div><div className="font-serif text-lg font-semibold text-primary">{Number(pkg.price) > 0 ? formatRupiah(pkg.price) : "Hubungi Kami"}</div></div>
            <button onClick={() => setOpen(true)} className="btn-primary !py-2.5" data-testid="package-mobile-register">Daftar Paket</button>
          </div>
        </div>
      )}
      <RegistrationModal pkg={pkg} open={open} onOpenChange={setOpen} />
      <div className="h-16 lg:hidden" />
    </div>
  );
}
