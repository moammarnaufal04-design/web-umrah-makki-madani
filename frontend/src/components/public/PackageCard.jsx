import { Link } from "react-router-dom";
import { CalendarDays, Clock, Plane, Users } from "lucide-react";
import { StatusBadge } from "@/components/public/StatusBadge";
import { PACKAGE_STATUS, formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PackageCard({ pkg, className, compact = false }) {
  const img = pkg.hero_image_url || pkg.flyer_url;
  const canRegister = !["FULL", "CLOSED", "SOLD_OUT"].includes(pkg.public_status);
  const pct = pkg.total_seats ? Math.min(100, Math.round(((pkg.seats_filled || 0) / pkg.total_seats) * 100)) : 0;
  return (
    <article data-testid={`package-card-${pkg.slug}`} className={cn("card-mm group flex h-full flex-col overflow-hidden hover:shadow-card", className)}>
      <Link to={`/packages/${pkg.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          <img src={img} alt={pkg.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-tosca-100 to-tosca-50 text-tosca-700"><Plane className="h-10 w-10" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-900/70 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <StatusBadge status={pkg.public_status} map={PACKAGE_STATUS} className="shadow" />
          {pkg.is_featured && <span className="rounded-full border border-gold-500/40 bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold text-gold-700 shadow">Unggulan</span>}
        </div>
        {pkg.category && <span className="absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-widest text-white/90">{pkg.category.name}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-sans text-base font-bold leading-snug text-foreground sm:text-lg">
          <Link to={`/packages/${pkg.slug}`} className="hover:text-primary" data-testid={`package-card-title-${pkg.slug}`}>{pkg.name}</Link>
        </h3>
        {!compact && pkg.short_description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pkg.short_description}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-primary" /><span>{pkg.departure_date ? formatDate(pkg.departure_date, { month: "short" }) : "Jadwal menyusul"}</span></div>
          <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /><span>{pkg.duration_days ? `${pkg.duration_days} Hari` : "-"}</span></div>
          <div className="flex items-center gap-1.5"><Plane className="h-3.5 w-3.5 text-primary" /><span className="truncate">{pkg.airline || "-"}</span></div>
          <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /><span>Sisa {pkg.remaining_seats} kursi</span></div>
        </dl>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Mulai dari</div>
            <div className="font-serif text-xl font-semibold text-primary" data-testid={`package-card-price-${pkg.slug}`}>{Number(pkg.price) > 0 ? formatRupiah(pkg.price) : "Hubungi Kami"}</div>
          </div>
          <div className="flex gap-2">
            <Link to={`/packages/${pkg.slug}`} className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary" data-testid={`package-card-detail-${pkg.slug}`}>Detail</Link>
            {canRegister && <Link to={`/packages/${pkg.slug}?daftar=1`} className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-tosca-800" data-testid={`package-card-register-${pkg.slug}`}>Daftar Paket</Link>}
          </div>
        </div>
      </div>
    </article>
  );
}
