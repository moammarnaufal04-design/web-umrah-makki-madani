import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Loader2, Plus, Search, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog, ExportButtons, PageHeader, StatCard, Toolbar } from "@/components/admin/Common";
import { StatusBadge } from "@/components/public/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TextField } from "@/components/admin/Fields";
import { PAY_STATUS, formatDate, formatRupiah } from "@/lib/format";

export default function Payments() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState(null);
  const [regSearch, setRegSearch] = useState("");
  const [pay, setPay] = useState({ registration_id: "", amount: "", payment_date: new Date().toISOString().slice(0, 10), method: "Transfer Bank", reference: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const params = { q: q || undefined, date_from: from || undefined, date_to: to || undefined, page, limit: 20 };
  const { data, isLoading } = useQuery({ queryKey: ["admin-payments", params], queryFn: async () => (await adminApi.get("/payments", { params })).data, keepPreviousData: true });
  const { data: summary } = useQuery({ queryKey: ["payments-summary"], queryFn: async () => (await adminApi.get("/payments/summary")).data });
  const { data: regs } = useQuery({ queryKey: ["reg-search", regSearch], queryFn: async () => (await adminApi.get("/registrations", { params: { q: regSearch || undefined, limit: 8 } })).data, enabled: open });
  const refresh = () => { ["admin-payments", "payments-summary", "admin-registrations", "dashboard", "admin-customers"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); };
  const submit = async (e) => {
    e.preventDefault();
    if (!pay.registration_id) { toast.error("Pilih pendaftaran terlebih dahulu"); return; }
    setBusy(true);
    try { await adminApi.post("/payments", { ...pay, amount: Number(pay.amount) }); toast.success("Pembayaran dicatat"); setOpen(false); setPay((p) => ({ ...p, registration_id: "", amount: "", reference: "", notes: "" })); refresh(); } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  const columns = [
    { key: "payment_date", label: "Tanggal", render: (p) => <span className="whitespace-nowrap text-xs">{formatDate(p.payment_date)}</span> },
    { key: "registration", label: "Jamaah / Paket", render: (p) => <div><div className="font-medium">{p.registration?.full_name}</div><div className="max-w-[240px] truncate text-xs text-muted-foreground">{p.registration?.code} · {p.registration?.package_name}</div></div> },
    { key: "amount", label: "Jumlah", render: (p) => <span className="whitespace-nowrap font-semibold text-emerald-700">{formatRupiah(p.amount)}</span> },
    { key: "method", label: "Metode / Ref", render: (p) => <span className="text-xs">{p.method || "-"}{p.reference && <span className="text-muted-foreground"> · {p.reference}</span>}</span> },
    { key: "status", label: "Status Pendaftaran", render: (p) => <StatusBadge status={p.registration?.payment_status} map={PAY_STATUS} /> },
    { key: "recorded_by", label: "Dicatat", render: (p) => <span className="text-xs text-muted-foreground">{p.recorded_by || "-"}</span> },
    { key: "actions", label: "", render: (p) => <button onClick={() => setDel(p)} className="rounded-md border p-1.5 text-destructive" aria-label="Hapus" data-testid={`payment-delete-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></button> },
  ];
  return (
    <div data-testid="admin-payments-page">
      <PageHeader title="Pembayaran" description="Pencatatan pembayaran manual. Sisa tagihan = harga paket − total dibayar, dihitung otomatis." actions={<><ExportButtons entity="payments" params={{ date_from: from || undefined, date_to: to || undefined }} /><button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="payment-add-button"><Plus className="h-4 w-4" /> Catat Pembayaran</button></>} />
      {summary && <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard icon={Banknote} label="Total Diterima" value={formatRupiah(summary.total_paid)} tone="emerald" testId="payments-total" /><StatCard icon={TrendingUp} label="Nilai Terdaftar" value={formatRupiah(summary.committed)} hint="Pendaftaran berstatus Terdaftar/Selesai" tone="navy" testId="payments-committed" /><StatCard icon={TrendingDown} label="Sisa Tagihan" value={formatRupiah(summary.outstanding)} tone="rose" testId="payments-outstanding" /></div>}
      <Toolbar>
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari nama, kode, paket, referensi…" className="pl-9" data-testid="payments-search" /></div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" data-testid="payments-from" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" data-testid="payments-to" />
      </Toolbar>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} meta={data} onPage={setPage} emptyTitle="Belum ada pembayaran" testId="payments-table" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="payment-dialog">
          <DialogHeader><DialogTitle>Catat Pembayaran</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            <div><label className="field-label">Cari pendaftaran</label><Input value={regSearch} onChange={(e) => setRegSearch(e.target.value)} placeholder="Nama / kode / paket" data-testid="payment-reg-search" /><ul className="mt-2 max-h-40 divide-y overflow-y-auto rounded-lg border text-sm">{(regs?.items || []).map((r) => <li key={r.id}><button type="button" onClick={() => setPay((p) => ({ ...p, registration_id: r.id }))} className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted ${pay.registration_id === r.id ? "bg-primary/10" : ""}`} data-testid={`payment-reg-option-${r.id}`}><span><span className="font-medium">{r.full_name}</span><span className="block text-xs text-muted-foreground">{r.code} · {r.package_name}</span></span><span className="text-xs text-rose-700">Sisa {formatRupiah(r.remaining_balance)}</span></button></li>)}{!regs?.items?.length && <li className="px-3 py-2 text-xs text-muted-foreground">Tidak ada hasil</li>}</ul></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Jumlah (Rp)" type="number" value={pay.amount} onChange={(v) => setPay((p) => ({ ...p, amount: v }))} required testId="payment-dialog-amount" />
              <TextField label="Tanggal" type="date" value={pay.payment_date} onChange={(v) => setPay((p) => ({ ...p, payment_date: v }))} required />
              <TextField label="Metode" value={pay.method} onChange={(v) => setPay((p) => ({ ...p, method: v }))} />
              <TextField label="Referensi" value={pay.reference} onChange={(v) => setPay((p) => ({ ...p, reference: v }))} />
              <TextField label="Catatan" value={pay.notes} onChange={(v) => setPay((p) => ({ ...p, notes: v }))} className="sm:col-span-2" />
            </div>
            <button type="submit" disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="payment-dialog-submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Pembayaran</button>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Hapus pembayaran ini?" description="Status pembayaran pendaftaran akan dihitung ulang." onConfirm={async () => { try { await adminApi.delete(`/payments/${del.id}`); toast.success("Pembayaran dihapus"); refresh(); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}
