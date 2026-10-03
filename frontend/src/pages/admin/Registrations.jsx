import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Plus, Search, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog, ExportButtons, PageHeader, Toolbar } from "@/components/admin/Common";
import { StatusBadge } from "@/components/public/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SelectField, TextField, TextareaField } from "@/components/admin/Fields";
import { DOC_STATUS, GENDER, PAY_STATUS, REG_STATUS, formatDate, formatDateTime, formatRupiah, optionsOf, waLink } from "@/lib/format";

export function RegistrationDetail({ id, onClose, onChanged }) {
  const qc = useQueryClient();
  const { data: reg, isLoading } = useQuery({ queryKey: ["registration", id], queryFn: async () => (await adminApi.get(`/registrations/${id}`)).data, enabled: !!id });
  const { data: pkgs } = useQuery({ queryKey: ["admin-packages", "all"], queryFn: async () => (await adminApi.get("/packages", { params: { limit: 200 } })).data });
  const [pay, setPay] = useState({ amount: "", payment_date: new Date().toISOString().slice(0, 10), method: "Transfer Bank", reference: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["registration", id] }); qc.invalidateQueries({ queryKey: ["admin-registrations"] }); qc.invalidateQueries({ queryKey: ["admin-payments"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["admin-customers"] }); qc.invalidateQueries({ queryKey: ["admin-packages"] }); onChanged?.(); };
  const update = async (patch) => { try { await adminApi.patch(`/registrations/${id}`, patch); toast.success("Pendaftaran diperbarui"); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const addPayment = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await adminApi.post("/payments", { ...pay, registration_id: id, amount: Number(pay.amount) }); toast.success("Pembayaran dicatat"); setPay((p) => ({ ...p, amount: "", reference: "", notes: "" })); refresh(); } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  const delPayment = async (pid) => { try { await adminApi.delete(`/payments/${pid}`); toast.success("Pembayaran dihapus"); refresh(); } catch (e) { toast.error(apiError(e)); } };
  if (isLoading || !reg) return <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const [notes, setNotesLocal] = [reg.admin_notes || "", null];
  return (
    <div className="space-y-6" data-testid="registration-detail">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-mono text-xs text-muted-foreground">{reg.code}</div><h3 className="font-sans text-lg font-bold" data-testid="registration-detail-name">{reg.full_name}</h3><div className="text-xs text-muted-foreground">{GENDER[reg.gender] || "-"} · Terdaftar {formatDateTime(reg.registered_at)}</div></div><a href={waLink(reg.whatsapp, `Assalamu'alaikum ${reg.full_name}, kami dari Makki Madani Tour & Travel menindaklanjuti pendaftaran Anda (${reg.code}) untuk paket ${reg.package_name}.`)} target="_blank" rel="noopener noreferrer" className="btn-wa !py-2 text-xs" data-testid="registration-whatsapp-link"><MessageCircle className="h-3.5 w-3.5" /> {reg.whatsapp}</a></div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Email</dt><dd>{reg.email || "-"}</dd></div><div><dt className="text-xs text-muted-foreground">Alamat</dt><dd>{reg.address || "-"}</dd></div><div><dt className="text-xs text-muted-foreground">Rencana</dt><dd>{reg.plan_month || "-"}</dd></div><div><dt className="text-xs text-muted-foreground">Sumber</dt><dd className="truncate text-xs">{reg.source_page || "-"}</dd></div>{reg.notes && <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Catatan jamaah</dt><dd>{reg.notes}</dd></div>}</dl>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField label="Status pendaftaran" value={reg.status} onChange={(v) => update({ status: v })} options={optionsOf(REG_STATUS)} testId="registration-status-select" />
        <SelectField label="Status dokumen" value={reg.document_status} onChange={(v) => update({ document_status: v })} options={optionsOf(DOC_STATUS)} testId="registration-document-select" />
        <SelectField label="Status pembayaran" value={reg.payment_status} onChange={(v) => update({ payment_status: v })} options={optionsOf(PAY_STATUS)} hint="Otomatis dihitung dari pembayaran; dapat diubah manual" testId="registration-payment-select" />
      </div>
      <SelectField label="Paket terdaftar" value={reg.package_id || ""} onChange={(v) => update({ package_id: v })} options={(pkgs?.items || []).map((p) => ({ value: p.id, label: p.name }))} testId="registration-package-select" />
      <div className="rounded-xl border p-4" data-testid="registration-payment-summary">
        <div className="mb-3 flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><h4 className="font-sans text-sm font-bold">Pembayaran</h4></div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><div className="text-xs text-muted-foreground">Harga paket</div><div className="font-semibold">{formatRupiah(reg.package_price)}</div></div>
          <div><div className="text-xs text-muted-foreground">DP</div><div className="font-semibold">{formatRupiah(reg.dp_amount)}</div></div>
          <div><div className="text-xs text-muted-foreground">Dibayar</div><div className="font-semibold text-emerald-700" data-testid="registration-total-paid">{formatRupiah(reg.total_paid)}</div></div>
          <div><div className="text-xs text-muted-foreground">Sisa</div><div className="font-semibold text-rose-700" data-testid="registration-remaining">{formatRupiah(reg.remaining_balance)}</div></div>
        </div>
        <ul className="mt-4 divide-y text-sm">{reg.payments.map((p) => <li key={p.id} className="flex items-center justify-between py-2" data-testid={`payment-row-${p.id}`}><div><div className="font-medium">{formatRupiah(p.amount)}</div><div className="text-xs text-muted-foreground">{formatDate(p.payment_date)} · {p.method || "-"} {p.reference && `· ${p.reference}`}</div></div><button onClick={() => delPayment(p.id)} className="rounded border p-1.5 text-destructive" aria-label="Hapus pembayaran" data-testid={`payment-delete-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></button></li>)}{!reg.payments.length && <li className="py-2 text-xs text-muted-foreground">Belum ada pembayaran</li>}</ul>
        <form onSubmit={addPayment} className="mt-4 grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2" data-testid="payment-form">
          <TextField label="Jumlah (Rp)" type="number" value={pay.amount} onChange={(v) => setPay((p) => ({ ...p, amount: v }))} required testId="payment-amount-input" />
          <TextField label="Tanggal" type="date" value={pay.payment_date} onChange={(v) => setPay((p) => ({ ...p, payment_date: v }))} required testId="payment-date-input" />
          <TextField label="Metode" value={pay.method} onChange={(v) => setPay((p) => ({ ...p, method: v }))} testId="payment-method-input" />
          <TextField label="Referensi" value={pay.reference} onChange={(v) => setPay((p) => ({ ...p, reference: v }))} testId="payment-reference-input" />
          <TextField label="Catatan" value={pay.notes} onChange={(v) => setPay((p) => ({ ...p, notes: v }))} className="sm:col-span-2" />
          <button type="submit" disabled={busy} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2" data-testid="payment-submit-button">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Catat Pembayaran</button>
        </form>
      </div>
      <AdminNotes initial={notes} onSave={(v) => update({ admin_notes: v })} />
    </div>
  );
}

function AdminNotes({ initial, onSave }) {
  const [v, setV] = useState(initial);
  return <div><TextareaField label="Catatan admin (internal)" value={v} onChange={setV} rows={3} testId="registration-admin-notes" /><button onClick={() => onSave(v)} className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary" data-testid="registration-notes-save">Simpan catatan</button></div>;
}

export default function Registrations() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [payment, setPayment] = useState("ALL");
  const [doc, setDoc] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("registered_at");
  const [order, setOrder] = useState("desc");
  const [selected, setSelected] = useState([]);
  const [active, setActive] = useState(null);
  const [del, setDel] = useState(null);
  const params = { q: q || undefined, status: status === "ALL" ? undefined : status, payment_status: payment === "ALL" ? undefined : payment, document_status: doc === "ALL" ? undefined : doc, page, limit: 20, sort, order };
  const { data, isLoading } = useQuery({ queryKey: ["admin-registrations", params], queryFn: async () => (await adminApi.get("/registrations", { params })).data, keepPreviousData: true });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-registrations"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); };
  const bulk = async (action, s) => { try { await adminApi.post("/registrations/bulk", { ids: selected, action, status: s }); toast.success("Pendaftaran diperbarui"); setSelected([]); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const onSort = (k) => { if (sort === k) setOrder(order === "asc" ? "desc" : "asc"); else { setSort(k); setOrder("asc"); } };
  const columns = [
    { key: "full_name", label: "Jamaah", sortable: true, render: (r) => <div><div className="font-medium">{r.full_name}</div><div className="text-xs text-muted-foreground">{r.whatsapp} · {r.code}</div></div> },
    { key: "package_name", label: "Paket", sortable: true, render: (r) => <span className="block max-w-[220px] truncate text-xs">{r.package_name || "-"}</span> },
    { key: "status", label: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} map={REG_STATUS} /> },
    { key: "document_status", label: "Dokumen", render: (r) => <StatusBadge status={r.document_status} map={DOC_STATUS} /> },
    { key: "payment_status", label: "Pembayaran", sortable: true, render: (r) => <div><StatusBadge status={r.payment_status} map={PAY_STATUS} /><div className="mt-1 text-[11px] text-muted-foreground">{formatRupiah(r.total_paid)} / {formatRupiah(r.package_price)}</div></div> },
    { key: "registered_at", label: "Tanggal", sortable: true, render: (r) => <span className="whitespace-nowrap text-xs">{formatDateTime(r.registered_at)}</span> },
    { key: "actions", label: "", stopPropagation: true, render: (r) => <button onClick={() => setDel(r)} className="rounded-md border p-1.5 text-destructive" aria-label="Hapus" data-testid={`registration-delete-${r.id}`}><Trash2 className="h-3.5 w-3.5" /></button> },
  ];
  return (
    <div data-testid="admin-registrations-page">
      <PageHeader title="Pendaftaran" description="Semua pendaftaran dari website dan admin. Klik baris untuk detail, status, dan pembayaran." actions={<ExportButtons entity="registrations" params={params} />} />
      <Toolbar>
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari nama, WhatsApp, kode, paket…" className="pl-9" data-testid="registrations-search" /></div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="w-40" data-testid="registrations-filter-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua status</SelectItem>{optionsOf(REG_STATUS).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
        <Select value={payment} onValueChange={(v) => { setPayment(v); setPage(1); }}><SelectTrigger className="w-40" data-testid="registrations-filter-payment"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua pembayaran</SelectItem>{optionsOf(PAY_STATUS).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
        <Select value={doc} onValueChange={(v) => { setDoc(v); setPage(1); }}><SelectTrigger className="w-40" data-testid="registrations-filter-document"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua dokumen</SelectItem>{optionsOf(DOC_STATUS).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
        {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs" data-testid="registrations-bulk-bar"><span className="font-semibold">{selected.length} dipilih</span><Select onValueChange={(v) => bulk("set_status", v)}><SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Ubah status…" /></SelectTrigger><SelectContent>{optionsOf(REG_STATUS).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>}
      </Toolbar>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} meta={data} onPage={setPage} sort={sort} order={order} onSort={onSort} selectable selected={selected} onSelect={setSelected} onRowClick={(r) => setActive(r.id)} emptyTitle="Belum ada pendaftaran" testId="registrations-table" />
      <Sheet open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl" data-testid="registration-sheet"><SheetHeader><SheetTitle>Detail Pendaftaran</SheetTitle></SheetHeader><div className="mt-4">{active && <RegistrationDetail id={active} onChanged={refresh} />}</div></SheetContent>
      </Sheet>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Hapus pendaftaran ${del?.code}?`} description="Pembayaran terkait juga akan dihapus." onConfirm={async () => { try { await adminApi.delete(`/registrations/${del.id}`); toast.success("Pendaftaran dihapus"); refresh(); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}
