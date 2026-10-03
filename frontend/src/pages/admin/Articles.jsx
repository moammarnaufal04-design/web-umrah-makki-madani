import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog, PageHeader, Toolbar } from "@/components/admin/Common";
import { StatusBadge } from "@/components/public/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ARTICLE_STATUS, formatDateTime, optionsOf } from "@/lib/format";

export default function Articles() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [del, setDel] = useState(null);
  const params = { q: q || undefined, status: status === "ALL" ? undefined : status, page, limit: 20 };
  const { data, isLoading } = useQuery({ queryKey: ["admin-articles", params], queryFn: async () => (await adminApi.get("/articles", { params })).data, keepPreviousData: true });
  const columns = [
    { key: "title", label: "Artikel", render: (a) => <div className="flex items-center gap-3"><div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">{a.featured_image_url && <img src={a.featured_image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><Link to={`/admin/content/articles/${a.id}`} className="block max-w-[320px] truncate font-medium hover:text-primary" data-testid={`article-link-${a.id}`}>{a.title}</Link><div className="text-xs text-muted-foreground">/{a.slug}</div></div></div> },
    { key: "category", label: "Kategori", render: (a) => <span className="text-xs">{a.category?.name || "-"}</span> },
    { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status} map={ARTICLE_STATUS} /> },
    { key: "published_at", label: "Publikasi", render: (a) => <span className="whitespace-nowrap text-xs">{a.published_at ? formatDateTime(a.published_at) : "-"}</span> },
    { key: "view_count", label: "Dilihat", render: (a) => <span className="text-xs">{a.view_count}</span> },
    { key: "actions", label: "", render: (a) => <div className="flex gap-1"><Link to={`/articles/${a.slug}`} target="_blank" className="rounded-md border p-1.5" aria-label="Lihat"><Eye className="h-3.5 w-3.5" /></Link><Link to={`/admin/content/articles/${a.id}`} className="rounded-md border p-1.5 hover:text-primary" aria-label="Edit" data-testid={`article-edit-${a.id}`}><Pencil className="h-3.5 w-3.5" /></Link><button onClick={() => setDel(a)} className="rounded-md border p-1.5 text-destructive" aria-label="Hapus" data-testid={`article-delete-${a.id}`}><Trash2 className="h-3.5 w-3.5" /></button></div> },
  ];
  return (
    <div data-testid="admin-articles-page">
      <PageHeader title="Artikel" description="CMS artikel SEO: draf, terbit, atau jadwalkan publikasi." actions={<Link to="/admin/content/articles/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="article-add-button"><Plus className="h-4 w-4" /> Artikel Baru</Link>} />
      <Toolbar>
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari judul…" className="pl-9" data-testid="articles-search" /></div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="w-40" data-testid="articles-filter-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua status</SelectItem>{optionsOf(ARTICLE_STATUS).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
      </Toolbar>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} meta={data} onPage={setPage} emptyTitle="Belum ada artikel" testId="articles-table" />
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Hapus artikel "${del?.title}"?`} onConfirm={async () => { try { await adminApi.delete(`/articles/${del.id}`); toast.success("Artikel dihapus"); qc.invalidateQueries({ queryKey: ["admin-articles"] }); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}
