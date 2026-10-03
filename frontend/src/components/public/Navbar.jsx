import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { GROUP_LABEL } from "@/lib/format";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Beranda", to: "/" },
  { label: "Paket", to: "/packages", dropdown: true },
  { label: "Tentang Kami", to: "/about" },
  { label: "Artikel", to: "/articles" },
  { label: "Kontak", to: "/contact" },
];

export function BrandMark({ className, light = false }) {
  const { brand } = useSite();
  const { resolvedTheme } = useTheme();
  const logo = light || resolvedTheme === "dark" ? brand.logo_dark_url || brand.logo_url : brand.logo_url;
  return (
    <Link to="/" className={cn("flex items-center gap-3", className)} data-testid="brand-logo">
      {logo ? (
        <img src={logo} alt={brand.name || "Makki Madani"} className="h-10 w-auto object-contain" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-serif text-lg font-bold text-primary-foreground shadow-md shadow-primary/30">M</span>
      )}
      <span className="leading-tight">
        <span className={cn("block font-serif text-base font-bold tracking-tight sm:text-lg", light ? "text-white" : "text-foreground")}>{brand.short_name || brand.name || "Makki Madani"}</span>
        <span className={cn("block text-[10px] font-medium uppercase tracking-[0.18em]", light ? "text-white/70" : "text-muted-foreground")}>Tour & Travel</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const { settings, categoriesByGroup, waUrl } = useSite();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const darkEnabled = settings.theme?.dark_mode_enabled !== false;
  const ctaLabel = settings.whatsapp?.cta_label || "Konsultasi Sekarang";
  const announcement = settings.general?.show_announcement && settings.general?.announcement;

  return (
    <header className="sticky top-0 z-40">
      {announcement && <div className="bg-navy-900 px-4 py-2 text-center text-xs font-medium text-white" data-testid="announcement-bar">{announcement}</div>}
      <div className="glass border-b border-border/60">
        <div className="container-mm flex h-[72px] items-center justify-between gap-4">
          <BrandMark />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {NAV.map((item) =>
              item.dropdown ? (
                <div key={item.to} className="group relative">
                  <NavLink to={item.to} data-testid="nav-packages" className={({ isActive }) => cn("flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary", (isActive || location.pathname.startsWith("/packages")) && "text-primary")}>
                    {item.label} <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                  </NavLink>
                  <div className="invisible absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="grid grid-cols-3 gap-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                      {["UMRAH", "HAJI", "WISATA"].map((g) => (
                        <div key={g}>
                          <Link to={`/packages/${g.toLowerCase()}`} className="eyebrow block hover:underline" data-testid={`nav-group-${g.toLowerCase()}`}>{GROUP_LABEL[g]}</Link>
                          <ul className="mt-3 space-y-1.5">
                            {categoriesByGroup(g).slice(0, 7).map((c) => (
                              <li key={c.id}><Link to={`/packages/${g.toLowerCase()}?category=${c.slug}`} className="block text-sm text-muted-foreground hover:text-primary">{c.name}</Link></li>
                            ))}
                            {categoriesByGroup(g).length > 7 && <li><Link to={`/packages/${g.toLowerCase()}`} className="text-sm font-semibold text-primary">Lihat semua →</Link></li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink key={item.to} to={item.to} end={item.to === "/"} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`} className={({ isActive }) => cn("rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary", isActive && "text-primary")}>{item.label}</NavLink>
              )
            )}
          </nav>
          <div className="flex items-center gap-2">
            {darkEnabled && (
              <button aria-label="Ganti tema" data-testid="theme-toggle" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="hidden h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary sm:flex">
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary hidden !py-2.5 sm:inline-flex" data-testid="nav-cta-whatsapp">{ctaLabel}</a>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button aria-label="Buka menu" data-testid="mobile-menu-button" className="flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden"><Menu className="h-5 w-5" /></button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-0" data-testid="mobile-menu">
                <div className="flex items-center justify-between border-b p-5">
                  <SheetTitle className="text-left"><BrandMark /></SheetTitle>
                  <button onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-full border p-2"><X className="h-4 w-4" /></button>
                </div>
                <nav className="flex flex-col p-5">
                  {NAV.filter((n) => !n.dropdown).map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => cn("rounded-lg px-3 py-3 text-base font-medium", isActive && "bg-primary/5 text-primary")}>{item.label}</NavLink>
                  ))}
                  <div className="mt-2 border-t pt-4">
                    <div className="eyebrow px-3">Paket</div>
                    {["UMRAH", "HAJI", "WISATA"].map((g) => (
                      <Link key={g} to={`/packages/${g.toLowerCase()}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-primary/5">{GROUP_LABEL[g]}</Link>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary w-full" data-testid="mobile-cta-whatsapp">{ctaLabel}</a>
                    {darkEnabled && <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="btn-outline w-full">{resolvedTheme === "dark" ? "Mode Terang" : "Mode Gelap"}</button>}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
