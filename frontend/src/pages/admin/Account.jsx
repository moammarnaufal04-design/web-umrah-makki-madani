import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog, PageHeader } from "@/components/admin/Common";
import { TextField } from "@/components/admin/Fields";

const EMPTY = { email: "", full_name: "", password: "" };

export default function Account() {
  const qc = useQueryClient();
  const { admin: me } = useAuth();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await adminApi.get("/admin-users")).data });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const create = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await adminApi.post("/admin-users", { ...form, password: form.password || undefined }); toast.success("Admin ditambahkan"); setOpen(false); setForm(EMPTY); refresh(); } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  const toggle = async (a) => { try { await adminApi.patch(`/admin-users/${a.id}`, { is_active: !a.is_active }); refresh(); } catch (err) { toast.error(apiError(err)); } };
  return (
    <div data-testid="admin-account-page">
      <PageHeader title="Admin Account" description="Kelola akun Super Admin yang dapat masuk ke dashboard." actions={<button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="admin-add-button"><Plus className="h-4 w-4" /> Tambah Admin</button>} />
      <div className="admin-surface mb-6 flex items-start gap-3 text-sm" data-testid="admin-me-card">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>
        <div><div className="font-semibold">Anda masuk sebagai {me?.full_name || me?.email}</div><div className="text-xs text-muted-foreground">{me?.email} · {me?.role?.replace("_", " ")}. Untuk mengganti password, gunakan fitur reset password Supabase Auth atau minta admin lain membuat akun baru.</div></div>
      </div>
      <div className="admin-surface p-0">
        {isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <ul className="divide-y" data-testid="admin-users-list">
            {rows.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" data-testid={`admin-row-${a.id}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{(a.full_name || a.email).charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{a.full_name || "-"} {a.id === me?.id && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Anda</span>}</div><div className="text-xs text-muted-foreground">{a.email} · Login terakhir: {a.last_login_at ? formatDateTime(a.last_login_at) : "-"}</div></div>
                <Switch checked={a.is_active} onCheckedChange={() => toggle(a)} disabled={a.id === me?.id} data-testid={`admin-toggle-${a.id}`} />
                <button onClick={() => setDel(a)} disabled={a.id === me?.id} className="rounded-md border p-2 text-destructive disabled:opacity-30" aria-label="Hapus" data-testid={`admin-delete-${a.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="admin-dialog">
          <DialogHeader><DialogTitle>Tambah Super Admin</DialogTitle></DialogHeader>
          <form onSubmit={create} className="grid gap-4">
            <TextField label="Email" type="email" required value={form.email} onChange={(v) => set("email", v)} testId="admin-email-input" />
            <TextField label="Nama lengkap" value={form.full_name} onChange={(v) => set("full_name", v)} testId="admin-name-input" />
            <TextField label="Password awal" type="password" value={form.password} onChange={(v) => set("password", v)} hint="Minimal 8 karakter. Kosongkan jika admin akan masuk lewat Google." testId="admin-password-input" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm">Batal</button><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="admin-save-button">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan</button></div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Hapus admin ${del?.email}?`} description="Akun login Supabase terkait juga akan dihapus." onConfirm={async () => { try { await adminApi.delete(`/admin-users/${del.id}`); toast.success("Admin dihapus"); refresh(); } catch (err) { toast.error(apiError(err)); } }} />
    </div>
  );
}
