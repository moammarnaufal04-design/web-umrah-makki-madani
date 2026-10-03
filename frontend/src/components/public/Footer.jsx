import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import { toast } from "sonner";
import { useSite } from "@/context/SiteContext";
import { publicApi, apiError } from "@/lib/api";
import { BrandMark } from "@/components/public/Navbar";

const TikTok = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16.5 3a4.9 4.9 0 0 0 3.5 3.6V10a8.3 8.3 0 0 1-3.5-1v6.3A5.7 5.7 0 1 1 10.8 9.6v3.5a2.3 2.3 0 1 0 2.3 2.3V3h3.4Z" /></svg>
);

export function Footer() {
  const { settings, brand, contact, social, waUrl } = useSite();
  const footer = settings.footer || {};
  const legal = settings.legal || {};
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const year = new Date().getFullYear();

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await publicApi.post("/newsletter", { email });
      toast.success(data.message || "Berhasil berlangganan");
      setEmail("");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const socials = [
    { href: social.instagram, icon: Instagram, label: "Instagram" },
    { href: social.tiktok, icon: TikTok, label: "TikTok" },
    { href: social.youtube, icon: Youtube, label: "YouTube" },
    { href: social.facebook, icon: Facebook, label: "Facebook" },
  ].filter((s) => s.href);

  return (
    <footer className="grain relative mt-24 bg-navy-900 text-slate-300" data-testid="site-footer">
      <div className="container-mm relative z-10 grid gap-12 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <BrandMark light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">{footer.description || brand.tagline}</p>
          <div className="mt-6 flex gap-2">
            {socials.map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} data-testid={`footer-social-${label.toLowerCase()}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-tosca-500 hover:text-tosca-500"><Icon className="h-4 w-4" /></a>
            ))}
          </div>
          {social.handle && <p className="mt-3 text-xs text-slate-500">{social.handle}</p>}
        </div>
        <div className="lg:col-span-2">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-white">Navigasi</h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            {(footer.quick_links || []).map((l) => <li key={l.href}><Link to={l.href} className="hover:text-tosca-500">{l.label}</Link></li>)}
            <li><Link to="/faq" className="hover:text-tosca-500">FAQ</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-white">Kontak</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {contact.address && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tosca-500" /><a href={contact.maps_link} target="_blank" rel="noopener noreferrer" className="hover:text-tosca-500" data-testid="footer-address">{contact.address}</a></li>}
            {contact.whatsapp && <li className="flex gap-3"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-tosca-500" /><a href={waUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-tosca-500" data-testid="footer-whatsapp">{contact.whatsapp}</a></li>}
            {contact.phone && contact.phone !== contact.whatsapp && <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-tosca-500" />{contact.phone}</li>}
            {contact.email && <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-tosca-500" /><a href={`mailto:${contact.email}`} className="hover:text-tosca-500">{contact.email}</a></li>}
            {contact.office_hours && <li className="pl-7 text-xs text-slate-500">{contact.office_hours}</li>}
          </ul>
        </div>
        <div className="lg:col-span-3">
          {footer.show_newsletter !== false && (
            <>
              <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-white">{footer.newsletter_title || "Newsletter"}</h3>
              <form onSubmit={subscribe} className="mt-5 flex gap-2" data-testid="newsletter-form">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Alamat email Anda" data-testid="newsletter-email-input" className="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-tosca-500 focus:outline-none" />
                <button type="submit" disabled={busy} data-testid="newsletter-submit-button" className="h-11 rounded-full bg-tosca-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-tosca-500 disabled:opacity-60">Kirim</button>
              </form>
            </>
          )}
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
            <div className="font-semibold uppercase tracking-wider text-slate-300">Legalitas</div>
            <div className="mt-2">PPIU: <span className="text-slate-300">{legal.ppiu || "-"}</span></div>
            <div>PIHK: <span className="text-slate-300">{legal.pihk || "-"}</span></div>
            <Link to="/legal" className="mt-2 inline-block text-tosca-500 hover:underline">Informasi legal →</Link>
          </div>
        </div>
      </div>
      <div className="relative z-10 border-t border-white/10">
        <div className="container-mm flex flex-col gap-3 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p data-testid="footer-copyright">{(footer.copyright || `© {year} ${brand.legal_name || brand.name}`).replace("{year}", year)}</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-tosca-500">Kebijakan Privasi</Link>
            <Link to="/terms" className="hover:text-tosca-500">Syarat & Ketentuan</Link>
            <Link to="/admin/login" className="hover:text-tosca-500" data-testid="footer-admin-link">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
