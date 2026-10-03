import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog, ExportButtons, PageHeader, Toolbar } from "@/components/admin/Common";
import { StatusBadge } from "@/components/public/StatusBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PACKAGE_STATUS, formatDate, formatRupiah } from "@/lib/format";

export default function Packages() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [published, setPublished] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [selected, setSelected] = useState([]);
  const [del, setDel] = useState(null);
  const [bulkDel, setBulkDel] = useState(false);
  const params = { q: q || undefined, group: group === "ALL" ? undefined : group, status: status === "ALL" ? undefined : status, published: published === "ALL" ? undefined : published === "YES", page, limit: 20, sort, order };
  const { data, isLoading } = useQuery({ queryKey: ["admin-packages", params], queryFn: async () => (await adminApi.get("/packages", { params })).data, keepPreviousData: true });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-packages"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); };
  const patch = async (id, body, msg) => { try { await adminApi.patch(`/packages/${id}`, body); toast.success(msg); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const duplicate = async (id) => { try { const { data: d } = await adminApi.post(`/packages/${id}/duplicate`); toast.success("Paket diduplikasi"); refresh(); navigate(`/admin/products/packages/${d.id}`); } catch (e) { toast.error(apiError(e)); } };
  const bulk = async (action) => { try { await adminApi.post("/packages/bulk", { ids: selected, action }); toast.success(`${selected.length} paket diperbarui`); setSelected([]); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const onSort = (k) => { if (sort === k) setOrder(order === "asc" ? "desc" : "asc"); else { setSort(k); setOrder("asc"); } };

  const columns = [
    { key: "name", label: "Paket", sortable: true, render: (p) => <div className="flex items-center gap-3"><div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">{(p.hero_image_url || p.flyer_url) && <img src={p.hero_image_url || p.flyer_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><Link to={`/admin/products/packages/${p.id}`} className="block max-w-[260px] truncate font-medium hover:text-primary" data-testid={`package-link-${p.id}`}>{p.name}</Link><div className="text-xs text-muted-foreground">{p.code} · {p.category?.name}</div></div></div> },
    { key: "departure_date", label: "Berangkat", sortable: true, render: (p) => <span className="whitespace-nowrap text-xs">{p.departure_date ? formatDate(p.departure_date, { month: "short" }) : "-"}<br /><span className="text-muted-foreground">{p.duration_days ? `${p.duration_days} hari` : ""}</span></span> },
    { key: "price", label: "Harga", sortable: true, render: (p) => <span className="whitespace-nowrap font-medium">{Number(p.price) > 0 ? formatRupiah(p.price) : "-"}</span> },
    { key: "seats_filled", label: "Kuota", sortable: true, render: (p) => <div className="w-28"><div className="flex justify-between text-xs"><span>{p.seats_filled}/{p.total_seats}</span><span className="text-muted-foreground">sisa {p.remaining_seats}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${p.total_seats ? Math.min(100, (p.seats_filled / p.total_seats) * 100) : 0}%` }} /></div></div> },
    { key: "public_status", label: "Status", render: (p) => <div className="flex flex-col gap-1"><StatusBadge status={p.public_status} map={PACKAGE_STATUS} />{p.status_override && <span className="text-[10px] text-muted-foreground">manual</span>}</div> },
    { key: "is_published", label: "Publikasi", render: (p) => <div className="flex flex-col gap-1 text-xs"><span className={p.is_published ? "text-emerald-700" : "text-muted-foreground"}>{p.is_published ? "Dipublikasi" : "Draf"}</span><span className={p.is_active ? "text-emerald-700" : "text-rose-600"}>{p.is_active ? "Aktif" : "Nonaktif"}</span>{p.is_featured && <span className="text-gold-600">Unggulan</span>}</div> },
    { key: "actions", label: "", stopPropagation: true, render: (p) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button className="rounded-md border p-1.5" aria-label="Aksi" data-testid={`package-actions-${p.id}`}><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild><Link to={`/admin/products/packages/${p.id}`} data-testid={`package-edit-${p.id}`}><Pencil className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
          <DropdownMenuItem onClick={() => patch(p.id, { is_published: !p.is_published }, p.is_published ? "Paket disembunyikan" : "Paket dipublikasikan")} data-testid={`package-publish-${p.id}`}>{p.is_published ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />} {p.is_published ? "Unpublish" : "Publish"}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => patch(p.id, { is_active: !p.is_active }, p.is_active ? "Paket dinonaktifkan" : "Paket diaktifkan")}>{p.is_active ? "Nonaktifkan" : "Aktifkan"}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => patch(p.id, { is_featured: !p.is_featured }, "Status unggulan diperbarui")}><Star className="mr-2 h-4 w-4" /> {p.is_featured ? "Hapus unggulan" : "Jadikan unggulan"}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicate(p.id)} data-testid={`package-duplicate-${p.id}`}><Copy className="mr-2 h-4 w-4" /> Duplikasi</DropdownMenuItem>
          <DropdownMenuItem asChild><Link to={`/packages/${p.slug}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Lihat di situs</Link></DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => setDel(p)} data-testid={`package-delete-${p.id}`}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) },
  ];

  return (
    <div data-testid="admin-packages-page">
      <PageHeader title="Manajemen Paket" description="Kelola paket Umrah, Haji, dan Wisata beserta kuota, harga, dan statusnya." actions={<><ExportButtons entity="packages" /><Link to="/admin/products/packages/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="package-add-button"><Plus className="h-4 w-4" /> Paket Baru</Link></>} />
      <Toolbar>
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari nama, kode, kategori…" className="pl-9" data-testid="packages-search" /></div>
        <Select value={group} onValueChange={(v) => { setGroup(v); setPage(1); }}><SelectTrigger className="w-36" data-testid="packages-filter-group"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua grup</SelectItem><SelectItem value="UMRAH">Umrah</SelectItem><SelectItem value="HAJI">Haji</SelectItem><SelectItem value="WISATA">Wisata</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="w-40" data-testid="packages-filter-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua status</SelectItem>{Object.entries(PACKAGE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
        <Select value={published} onValueChange={(v) => { setPublished(v); setPage(1); }}><SelectTrigger className="w-36" data-testid="packages-filter-published"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Publik & draf</SelectItem><SelectItem value="YES">Dipublikasi</SelectItem><SelectItem value="NO">Draf</SelectItem></SelectContent></Select>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs" data-testid="packages-bulk-bar">
            <span className="font-semibold">{selected.length} dipilih</span>
            <button onClick={() => bulk("publish")} className="rounded border bg-card px-2 py-1 hover:text-primary">Publish</button>
            <button onClick={() => bulk("unpublish")} className="rounded border bg-card px-2 py-1 hover:text-primary">Unpublish</button>
            <button onClick={() => bulk("activate")} className="rounded border bg-card px-2 py-1 hover:text-primary">Aktifkan</button>
            <button onClick={() => bulk("deactivate")} className="rounded border bg-card px-2 py-1 hover:text-primary">Nonaktifkan</button>
            <button onClick={() => setBulkDel(true)} className="rounded border bg-card px-2 py-1 text-destructive" data-testid="packages-bulk-delete">Hapus</button>
          </div>
        )}
      </Toolbar>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} meta={data} onPage={setPage} sort={sort} order={order} onSort={onSort} selectable selected={selected} onSelect={setSelected} emptyTitle="Belum ada paket" emptyDescription="Buat paket pertama Anda." testId="packages-table" />
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Hapus paket "${del?.name}"?`} description="Paket beserta itinerary, galeri, dan FAQ-nya akan dihapus. Pendaftaran yang terkait tetap tersimpan." onConfirm={async () => { try { await adminApi.delete(`/packages/${del.id}`); toast.success("Paket dihapus"); refresh(); } catch (e) { toast.error(apiError(e)); } }} />
      <ConfirmDialog open={bulkDel} onOpenChange={setBulkDel} title={`Hapus ${selected.length} paket?`} onConfirm={() => bulk("delete")} />
    </div>
  );
}
