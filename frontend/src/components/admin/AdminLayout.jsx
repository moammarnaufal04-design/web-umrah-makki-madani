import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, BookOpen, Boxes, ChevronDown, ExternalLink, FileText, FolderKanban, HelpCircle, Home, Image as ImageIcon, Info, LayoutDashboard, LogOut, Mail, Menu, MessageSquare, Package, Quote, Scale, Search, Settings, Share2, Shield, Tags, UserCog, Users, Wallet, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const MENU = [
  { label: "Dashboard", items: [{ to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true }] },
  { label: "Website", items: [
    { to: "/admin/website/homepage", icon: Home, label: "Homepage" },
    { to: "/admin/website/about", icon: Info, label: "About" },
    { to: "/admin/website/testimonials", icon: Quote, label: "Testimonials" },
    { to: "/admin/website/faq", icon: HelpCircle, label: "FAQ" },
    { to: "/admin/website/contact", icon: Mail, label: "Contact" },
    { to: "/admin/website/social", icon: Share2, label: "Social Media" },
    { to: "/admin/website/media", icon: ImageIcon, label: "Media Library" },
  ] },
  { label: "Products", items: [
    { to: "/admin/products/categories", icon: FolderKanban, label: "Categories" },
    { to: "/admin/products/packages", icon: Package, label: "Packages" },
  ] },
  { label: "Customers", items: [
    { to: "/admin/customers/jamaah", icon: Users, label: "Jamaah" },
    { to: "/admin/customers/registrations", icon: BookOpen, label: "Registrations" },
    { to: "/admin/customers/payments", icon: Wallet, label: "Payments" },
    { to: "/admin/customers/messages", icon: MessageSquare, label: "Pesan & Newsletter" },
  ] },
  { label: "Content", items: [
    { to: "/admin/content/articles", icon: FileText, label: "Articles" },
    { to: "/admin/content/categories", icon: Boxes, label: "Categories" },
    { to: "/admin/content/tags", icon: Tags, label: "Tags" },
  ] },
  { label: "Settings", items: [
    { to: "/admin/settings/general", icon: Settings, label: "General" },
    { to: "/admin/settings/seo", icon: Search, label: "SEO" },
    { to: "/admin/settings/whatsapp", icon: MessageSquare, label: "WhatsApp" },
    { to: "/admin/settings/legal", icon: Scale, label: "Legal" },
    { to: "/admin/settings/account", icon: UserCog, label: "Admin Account" },
  ] },
];

function SidebarNav({ onNavigate }) {
  const { brand } = useSite();
  return (
    <div className="flex h-full flex-col bg-navy-900 text-slate-300">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tosca-600 font-serif text-lg font-bold text-white">M</span>
        <div className="leading-tight"><div className="font-serif text-base font-bold text-white">{brand.short_name || "Makki Madani"}</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Travel Management</div></div>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" data-testid="admin-sidebar">
        {MENU.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{group.label}</div>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} data-testid={`sidebar-${item.to.replace(/\//g, "-").slice(1)}`} className={({ isActive }) => cn("mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white", isActive && "bg-tosca-600/20 text-tosca-200 hover:bg-tosca-600/25")}>
                <item.icon className="h-4 w-4 shrink-0" />{item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-[11px] text-slate-500"><Shield className="mr-1 inline h-3 w-3" /> Super Admin · v1.0</div>
    </div>
  );
}

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const current = MENU.flatMap((g) => g.items).find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)));
  return (
    <div className="flex min-h-screen bg-[#F3F6F5] dark:bg-background" data-testid="admin-layout">
      <aside className="hidden w-64 shrink-0 lg:block"><div className="sticky top-0 h-screen"><SidebarNav /></div></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0"><SheetTitle className="sr-only">Menu Admin</SheetTitle><SidebarNav onNavigate={() => setOpen(false)} /></SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg border p-2 lg:hidden" aria-label="Menu" data-testid="admin-mobile-menu"><Menu className="h-4 w-4" /></button>
            <div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin</div><div className="text-sm font-semibold" data-testid="admin-page-title">{current?.label || "Dashboard"}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary sm:flex" data-testid="admin-view-site"><ExternalLink className="h-3.5 w-3.5" /> Lihat Situs</Link>
            <div className="hidden text-right sm:block"><div className="text-xs font-semibold" data-testid="admin-user-email">{admin?.email}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{admin?.role?.replace("_", " ")}</div></div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{(admin?.full_name || admin?.email || "A").charAt(0).toUpperCase()}</span>
            <button onClick={logout} className="rounded-full border p-2 text-muted-foreground hover:text-destructive" aria-label="Keluar" data-testid="admin-logout-button"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
