import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumbs" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
      <Link to="/" className="flex items-center gap-1 hover:text-primary"><Home className="h-3.5 w-3.5" /> Beranda</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          {it.href && i < items.length - 1 ? <Link to={it.href} className="hover:text-primary">{it.label}</Link> : <span className="line-clamp-1 max-w-[240px] font-medium text-foreground">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
