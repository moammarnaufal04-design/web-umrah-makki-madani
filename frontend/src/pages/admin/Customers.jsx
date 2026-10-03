import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog, ExportButtons, PageHeader, Toolbar } from "@/components/admin/Common";
import { StatusBadge } from "@/components/public/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { SelectField, TextField, TextareaField } from "@/components/admin/Fields";
import { RegistrationDetail } from "@/pages/admin/Registrations";
import { GENDER, PAY_STATUS, REG_STATUS, formatDate, formatDateTime, formatRupiah, waLink } from "@/lib/format";

function CustomerDetail({ id }) {
  const qc = useQueryClient();
  const { data: c, isLoading } = useQuery({ queryKey: ["customer", id], queryFn: async () => (await adminApi.get(`/customers/${id}`)).data });
  const [form, setForm] = useState(null);
  const [regId, setRegId] = useState(null);
  if (isLoading || !c) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const f = form || { full_name: c.full_name, gender: c.gender || "", address: c.address || "", whatsapp: c.whatsapp, email: c.email || "", notes: c.notes || "" };
  const save = async () => { try { await adminApi.patch(`/customers/${id}`, { ...f, email: f.email || null, gender: f.gender || null }); toast.success("Data jamaah disimpan"); qc.invalidateQueries({ queryKey: ["customer", id] }); qc.invalidateQueries({ queryKey: ["admin-customers"] }); } catch (e) { toast.error(apiError(e)); } };
  if (regId) return <div><button onClick={() => setRegId(null)} className="mb-3 text-xs font-semibold text-primary">← Kembali ke profil jamaah</button><RegistrationDetail id={regId} onChanged={() => qc.invalidateQueries({ queryKey: ["customer", id] })} /></div>;
  return (
    <div className="space-y-5" data-testid="customer-detail">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Nama lengkap" value={f.full_name} onChange={(v) => setForm({ ...f, full_name: v })} testId="customer-name-input" />
        <SelectField label="Jenis kelamin" value={f.gender} onChange={(v) => setForm({ ...f, gender: v })} options={[{ value: "MALE", label: "Laki-laki" }, { value: "FEMALE", label: "Perempuan" }]} />
        <TextField label="WhatsApp" value={f.whatsapp} onChange={(v) => setForm({ ...f, whatsapp: v })} testId="customer-whatsapp-input" />
        <TextField label="Email" value={f.email} onChange={(v) => setForm({ ...f, email: v })} />
        <TextareaField label="Alamat" value={f.address} onChange={(v) => setForm({ ...f, address: v })} rows={2} className="sm:col-span-2" />
        <TextareaField label="Catatan internal" value={f.notes} onChange={(v) => setForm({ ...f, notes: v })} rows={2} className="sm:col-span-2" />
      </div>
      <div className="flex gap-2"><button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="customer-save-button">Simpan</button><a href={waLink(c.whatsapp, `Assalamu'alaikum ${c.full_name}, kami dari Makki Madani Tour & Travel.`)} target="_blank" rel="noopener noreferrer" className="btn-wa !py-2 text-xs"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a></div>
      <div>
        <h4 className="mb-2 font-sans text-sm font-bold">Riwayat Pendaftaran ({c.registrations.length})</h4>
        <ul className="divide-y rounded-xl border">{c.registrations.map((r) => <li key={r.id} className="flex cursor-pointer items-center justify-between gap-3 p-3 hover:bg-muted/40" onClick={() => setRegId(r.id)} data-testid={`customer-registration-${r.id}`}><div className="min-w-0"><div className="truncate text-sm font-medium">{r.package_name}</div><div className="text-xs text-muted-foreground">{r.code} · {formatDateTime(r.registered_at)}</div></div><div className="flex shrink-0 flex-col items-end gap-1"><StatusBadge status={r.status} map={REG_STATUS} /><StatusBadge status={r.payment_status} map={PAY_STATUS} /></div></li>)}{!c.registrations.length && <li className="p-3 text-xs text-muted-foreground">Belum ada pendaftaran</li>}</ul>
      </div>
    </div>
  );
}

export default function Customers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);
  const [del, setDel] = useState(null);
  const params = { q: q || undefined, page, limit: 20 };
  const { data, isLoading } = useQuery({ queryKey: ["admin-customers", params], queryFn: async () => (await adminApi.get("/customers", { params })).data, keepPreviousData: true });
  const columns = [
    { key: "full_name", label: "Jamaah", render: (c) => <div><div className="font-medium">{c.full_name}</div><div className="text-xs text-muted-foreground">{GENDER[c.gender] || "-"} · {c.whatsapp}</div></div> },
    { key: "email", label: "Email", render: (c) => <span className="text-xs">{c.email || "-"}</span> },
    { key: "address", label: "Alamat", render: (c) => <span className="block max-w-[220px] truncate text-xs">{c.address || "-"}</span> },
    { key: "registration_count", label: "Pendaftaran", render: (c) => <div className="text-xs"><span className="font-semibold">{c.registration_count}</span>{c.latest_registration && <div className="mt-1 flex items-center gap-1"><StatusBadge status={c.latest_registration.status} map={REG_STATUS} /></div>}</div> },
    { key: "total_paid", label: "Total Dibayar", render: (c) => <span className="whitespace-nowrap text-xs font-medium">{formatRupiah(c.total_paid)}</span> },
    { key: "created_at", label: "Sejak", render: (c) => <span className="whitespace-nowrap text-xs">{formatDate(c.created_at, { month: "short" })}</span> },
    { key: "actions", label: "", stopPropagation: true, render: (c) => <button onClick={() => setDel(c)} className="rounded-md border p-1.5 text-destructive" aria-label="Hapus" data-testid={`customer-delete-${c.id}`}><Trash2 className="h-3.5 w-3.5" /></button> },
  ];
  return (
    <div data-testid="admin-customers-page">
      <PageHeader title="Data Jamaah" description="Database jamaah (customer) — sumber kebenaran utama. Export CSV/XLSX kapan saja." actions={<ExportButtons entity="customers" params={{ q: q || undefined }} />} />
      <Toolbar><div className="relative min-w-[260px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari nama, WhatsApp, email, alamat…" className="pl-9" data-testid="customers-search" /></div></Toolbar>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} meta={data} onPage={setPage} onRowClick={(c) => setActive(c.id)} emptyTitle="Belum ada jamaah" testId="customers-table" />
      <Sheet open={!!active} onOpenChange={(v) => !v && setActive(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-xl" data-testid="customer-sheet"><SheetHeader><SheetTitle>Profil Jamaah</SheetTitle></SheetHeader><div className="mt-4">{active && <CustomerDetail id={active} />}</div></SheetContent></Sheet>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Hapus jamaah "${del?.full_name}"?`} description="Seluruh pendaftaran dan pembayaran jamaah ini akan ikut terhapus." onConfirm={async () => { try { await adminApi.delete(`/customers/${del.id}`); toast.success("Jamaah dihapus"); qc.invalidateQueries({ queryKey: ["admin-customers"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}
