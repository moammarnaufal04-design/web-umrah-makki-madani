import { useState } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { useSite } from "@/context/SiteContext";
import { useSeo, breadcrumbSchema, organizationSchema } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { publicApi, apiError } from "@/lib/api";

export default function Contact() {
  const { settings, contact, waUrl } = useSite();
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  useSeo({ title: "Kontak & Konsultasi", description: `Hubungi ${settings.brand?.name || "Makki Madani"} di Banda Aceh untuk konsultasi Umrah, Haji, dan Wisata Halal.`, path: "/contact", jsonLd: [organizationSchema(settings), breadcrumbSchema([{ label: "Kontak", href: "/contact" }])] });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await publicApi.post("/contact", { ...form, email: form.email || null, subject: form.subject || null });
      setResult(data);
      toast.success("Pesan terkirim. Kami akan menghubungi Anda.");
    } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  const info = [
    contact.whatsapp && { icon: MessageCircle, label: "WhatsApp", value: contact.whatsapp, href: waUrl() },
    contact.phone && contact.phone !== contact.whatsapp && { icon: Phone, label: "Telepon", value: contact.phone, href: `tel:${contact.phone}` },
    contact.email && { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.address && { icon: MapPin, label: "Alamat Kantor", value: contact.address, href: contact.maps_link },
    contact.office_hours && { icon: Clock, label: "Jam Operasional", value: contact.office_hours },
  ].filter(Boolean);

  return (
    <div className="container-mm py-10 sm:py-14" data-testid="contact-page">
      <Breadcrumbs items={[{ label: "Kontak" }]} />
      <div className="mt-6 max-w-2xl"><div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow">Kontak</span></div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Hubungi Kami</h1><p className="mt-3 text-base text-muted-foreground md:text-lg">Konsultasikan rencana perjalanan ibadah Anda. Tim kami melayani jamaah dari Aceh, Sumatra, Jakarta, dan seluruh Indonesia.</p></div>
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          {info.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="card-mm flex gap-4 p-5" data-testid={`contact-info-${label.toLowerCase().replace(/\s+/g, "-")}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-sm font-semibold hover:text-primary">{value}</a> : <div className="mt-0.5 text-sm font-semibold">{value}</div>}</div></div>
          ))}
          <a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-wa w-full" data-testid="contact-whatsapp-button"><MessageCircle className="h-4 w-4" /> Konsultasi via WhatsApp</a>
        </div>
        <div className="lg:col-span-7">
          {result ? (
            <div className="card-mm p-8 text-center" data-testid="contact-success"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Send className="h-6 w-6" /></div><h2 className="mt-4 text-2xl font-semibold">Pesan Terkirim</h2><p className="mt-2 text-sm text-muted-foreground">Terima kasih. Kami akan segera menghubungi Anda. Untuk respon lebih cepat, lanjutkan via WhatsApp.</p>{result.whatsapp_url && <a href={result.whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn-wa mt-6"><MessageCircle className="h-4 w-4" /> Lanjut ke WhatsApp</a>}</div>
          ) : (
            <form onSubmit={submit} className="card-mm grid gap-4 p-6 sm:p-8" data-testid="contact-form">
              <h2 className="font-sans text-lg font-bold">Formulir Konsultasi</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="c-name">Nama</Label><Input id="c-name" required value={form.name} onChange={set("name")} className="mt-1.5 h-11" data-testid="contact-name-input" /></div>
                <div><Label htmlFor="c-wa">WhatsApp</Label><Input id="c-wa" required value={form.whatsapp} onChange={set("whatsapp")} placeholder="08xxxxxxxxxx" className="mt-1.5 h-11" data-testid="contact-whatsapp-input" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="c-email">Email (opsional)</Label><Input id="c-email" type="email" value={form.email} onChange={set("email")} className="mt-1.5 h-11" data-testid="contact-email-input" /></div>
                <div><Label htmlFor="c-subject">Topik</Label><Input id="c-subject" value={form.subject} onChange={set("subject")} placeholder="Misal: Umrah Ramadan 2027" className="mt-1.5 h-11" data-testid="contact-subject-input" /></div>
              </div>
              <div><Label htmlFor="c-message">Pesan</Label><Textarea id="c-message" required rows={5} value={form.message} onChange={set("message")} placeholder="Ceritakan rencana perjalanan Anda…" className="mt-1.5" data-testid="contact-message-input" /></div>
              <input type="text" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60" data-testid="contact-submit-button"><Send className="h-4 w-4" /> {busy ? "Mengirim…" : "Kirim Pesan"}</button>
            </form>
          )}
        </div>
      </div>
      {contact.maps_embed_url && <div className="mt-12 overflow-hidden rounded-[2rem] border border-border shadow-soft" data-testid="contact-map"><iframe title="Lokasi kantor Makki Madani" src={contact.maps_embed_url} loading="lazy" className="h-[360px] w-full border-0" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /></div>}
    </div>
  );
}
