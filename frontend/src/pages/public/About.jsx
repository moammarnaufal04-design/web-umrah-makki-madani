import { Link } from "react-router-dom";
import { Building2, Eye, History, Landmark, ShieldCheck, Target } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { useSeo, breadcrumbSchema, organizationSchema } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SectionHeading } from "@/components/public/SectionHeading";

const PersonCard = ({ p, i, prefix }) => (
  <div className="card-mm flex items-center gap-4 p-5" data-testid={`${prefix}-${i}`}>
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 font-serif text-2xl font-semibold text-primary">{p.photo_url ? <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" /> : (p.name || "?").replace(/^(Abi|Ummi)\s+/i, "").charAt(0)}</div>
    <div><div className="font-sans text-base font-bold leading-snug">{p.name}</div><div className="text-sm text-primary">{p.role}</div></div>
  </div>
);

export default function About() {
  const { settings, brand, contact } = useSite();
  const about = settings.about || {};
  const legal = settings.legal || {};
  useSeo({ title: `Tentang ${brand.name || "Makki Madani"}`, description: (about.profile || "").split("\n")[0], path: "/about", jsonLd: [organizationSchema(settings), breadcrumbSchema([{ label: "Tentang Kami", href: "/about" }])] });

  return (
    <div data-testid="about-page">
      <div className="container-mm py-10 sm:py-14">
        <Breadcrumbs items={[{ label: "Tentang Kami" }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7"><div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow">Tentang Kami</span></div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{brand.name}</h1><p className="mt-2 font-serif text-lg italic text-primary">“{brand.tagline}”</p><p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted-foreground md:text-lg" data-testid="about-profile">{about.profile}</p></div>
          <div className="lg:col-span-5"><div className="aspect-[4/3] overflow-hidden rounded-[2rem] bg-muted shadow-soft">{about.office_image_url ? <img src={about.office_image_url} alt="Kantor Makki Madani" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><Building2 className="h-10 w-10" /><span className="text-xs">Foto kantor (placeholder — unggah dari dashboard)</span></div>}</div></div>
        </div>
      </div>

      <section className="bg-secondary/40 py-16 dark:bg-secondary/20">
        <div className="container-mm grid gap-6 md:grid-cols-2">
          <div className="card-mm p-8"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Eye className="h-5 w-5" /></span><h2 className="text-2xl font-semibold">Visi</h2></div><p className="mt-4 text-base leading-relaxed text-muted-foreground" data-testid="about-vision">{about.vision}</p></div>
          <div className="card-mm p-8"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Target className="h-5 w-5" /></span><h2 className="text-2xl font-semibold">Misi</h2></div><ul className="mt-4 space-y-2.5 text-sm text-muted-foreground" data-testid="about-mission">{(about.mission || []).map((m, i) => <li key={i} className="flex gap-3"><span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>{m}</li>)}</ul></div>
        </div>
      </section>

      {about.values?.length > 0 && <section className="container-mm section-mm"><SectionHeading eyebrow="Nilai Kami" title="Prinsip yang kami pegang" /><div className="grid gap-6 md:grid-cols-3">{about.values.map((v, i) => <div key={i} className="rounded-2xl border-l-4 border-accent bg-card p-6 shadow-sm"><h3 className="font-sans text-lg font-bold">{v.title}</h3><p className="mt-2 text-sm text-muted-foreground">{v.description}</p></div>)}</div></section>}

      {about.history && <section className="container-mm pb-16"><div className="card-mm grid gap-6 p-8 sm:grid-cols-[auto_1fr] sm:p-10"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><History className="h-6 w-6" /></span><div><h2 className="text-2xl font-semibold">Sejarah Singkat</h2><p className="mt-3 text-base leading-relaxed text-muted-foreground" data-testid="about-history">{about.history}</p></div></div></section>}

      <section className="bg-navy-900 py-16 text-white sm:py-24" data-testid="about-leadership">
        <div className="container-mm grid gap-12 lg:grid-cols-2">
          <div><div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow !text-gold-500">Pembina</span></div><h2 className="text-2xl font-semibold sm:text-3xl">Pembina</h2><div className="mt-6 grid gap-4">{(about.pembina || []).map((p, i) => <PersonCard key={i} p={p} i={i} prefix="pembina" />)}</div></div>
          <div><div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow !text-gold-500">Penasihat</span></div><h2 className="text-2xl font-semibold sm:text-3xl">Penasihat</h2><div className="mt-6 grid gap-4">{(about.penasihat || []).map((p, i) => <PersonCard key={i} p={p} i={i} prefix="penasihat" />)}</div></div>
        </div>
      </section>

      <section className="container-mm section-mm" data-testid="about-legal">
        <SectionHeading eyebrow="Legalitas" title="Informasi Legal & Kepercayaan" subtitle="Kami hanya mencantumkan informasi perizinan yang telah terverifikasi. Placeholder akan diperbarui setelah dokumen resmi tersedia." />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card-mm p-6"><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="eyebrow">PPIU</span></div><p className="mt-3 text-sm">{legal.ppiu}</p></div>
          <div className="card-mm p-6"><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="eyebrow">PIHK</span></div><p className="mt-3 text-sm">{legal.pihk}</p></div>
          <div className="card-mm p-6"><div className="flex items-center gap-2 text-primary"><Landmark className="h-5 w-5" /><span className="eyebrow">Badan Hukum</span></div><p className="mt-3 text-sm">{brand.legal_name}</p><p className="mt-1 text-xs text-muted-foreground">{legal.company_legal}</p></div>
        </div>
        <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>{legal.notes}</p><Link to="/legal" className="btn-outline shrink-0">Halaman Legal</Link></div>
      </section>

      <section className="container-mm pb-8"><div className="card-mm overflow-hidden"><div className="grid lg:grid-cols-2"><div className="p-8 sm:p-10"><div className="eyebrow">Kantor Kami</div><h2 className="mt-2 text-2xl font-semibold">Kunjungi kami di Banda Aceh</h2><p className="mt-3 text-sm text-muted-foreground">{contact.address}</p>{contact.office_hours && <p className="mt-2 text-sm text-muted-foreground">{contact.office_hours}</p>}<Link to="/contact" className="btn-primary mt-6">Hubungi Kami</Link></div>{contact.maps_embed_url && <iframe title="Lokasi kantor" src={contact.maps_embed_url} loading="lazy" className="min-h-[280px] w-full border-0" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />}</div></div></section>
    </div>
  );
}
