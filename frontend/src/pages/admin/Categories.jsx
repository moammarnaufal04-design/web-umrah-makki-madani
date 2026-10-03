import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog, PageHeader } from "@/components/admin/Common";
import { SelectField, SwitchField, TextField, TextareaField } from "@/components/admin/Fields";
import { ImageField } from "@/components/admin/MediaPicker";
import { GROUP_LABEL } from "@/lib/format";

const EMPTY = { name: "", slug: "", group_type: "UMRAH", description: "", image_url: "", is_active: true, sort_order: 0 };

export default function Categories() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await adminApi.get("/categories")).data });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["site"] }); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { editing?.id ? await adminApi.put(`/categories/${editing.id}`, form) : await adminApi.post("/categories", form); toast.success("Kategori disimpan"); setEditing(null); refresh(); } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  const toggle = async (c) => { try { await adminApi.patch(`/categories/${c.id}/toggle`); refresh(); } catch (err) { toast.error(apiError(err)); } };
  const move = async (group, i, d) => {
    const list = rows.filter((r) => r.group_type === group); const next = [...list]; const [it] = next.splice(i, 1); next.splice(i + d, 0, it);
    try { await adminApi.patch("/categories/reorder", { ids: next.map((r) => r.id) }); refresh(); } catch (err) { toast.error(apiError(err)); }
  };
  return (
    <div data-testid="admin-categories-page">
      <PageHeader title="Kategori Produk" description="Kelola kategori Haji, Umrah, dan Wisata. Perubahan langsung tampil di menu website." actions={<button onClick={() => { setEditing({}); setForm(EMPTY); }} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="category-add-button"><Plus className="h-4 w-4" /> Tambah Kategori</button>} />
      {isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="grid gap-6 xl:grid-cols-3">
          {["UMRAH", "HAJI", "WISATA"].map((g) => {
            const list = rows.filter((r) => r.group_type === g);
            return (
              <div key={g} className="admin-surface p-0" data-testid={`category-group-${g.toLowerCase()}`}>
                <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-sans text-sm font-bold uppercase tracking-wider">{GROUP_LABEL[g]}</h2><span className="text-xs text-muted-foreground">{list.length} kategori</span></div>
                <ul className="divide-y">
                  {list.map((c, i) => (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-3" data-testid={`category-row-${c.id}`}>
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">{c.image_url && <img src={c.image_url} alt="" className="h-full w-full object-cover" />}</div>
                      <div className="min-w-0 flex-1"><div className={`truncate text-sm font-medium ${!c.is_active && "text-muted-foreground line-through"}`}>{c.name}</div><div className="text-xs text-muted-foreground">/{c.slug} · {c.package_count} paket</div></div>
                      <Switch checked={c.is_active} onCheckedChange={() => toggle(c)} data-testid={`category-toggle-${c.id}`} />
                      <div className="flex gap-1"><button onClick={() => move(g, i, -1)} disabled={i === 0} className="rounded-md border p-1.5 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button><button onClick={() => move(g, i, 1)} disabled={i === list.length - 1} className="rounded-md border p-1.5 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button><button onClick={() => { setEditing(c); setForm({ ...EMPTY, ...c }); }} className="rounded-md border p-1.5 hover:text-primary" data-testid={`category-edit-${c.id}`}><Pencil className="h-3 w-3" /></button><button onClick={() => setDel(c)} className="rounded-md border p-1.5 text-destructive" data-testid={`category-delete-${c.id}`}><Trash2 className="h-3 w-3" /></button></div>
                    </li>
                  ))}
                  {!list.length && <li className="px-4 py-6 text-center text-xs text-muted-foreground">Belum ada kategori</li>}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="category-dialog">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid gap-4">
            <TextField label="Nama kategori" value={form.name} onChange={(v) => set("name", v)} required testId="category-name-input" />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Grup" value={form.group_type} onChange={(v) => set("group_type", v)} options={Object.entries(GROUP_LABEL).map(([value, label]) => ({ value, label }))} testId="category-group-select" />
              <TextField label="Slug (opsional)" value={form.slug} onChange={(v) => set("slug", v)} hint="Kosongkan untuk otomatis" testId="category-slug-input" />
            </div>
            <TextareaField label="Deskripsi" value={form.description} onChange={(v) => set("description", v)} testId="category-description-input" />
            <ImageField label="Gambar kategori" value={form.image_url} onChange={(v) => set("image_url", v)} folder="category" testId="category-image" />
            <SwitchField label="Aktif" value={form.is_active} onChange={(v) => set("is_active", v)} testId="category-active-switch" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">Batal</button><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="category-save-button">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan</button></div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Hapus kategori "${del?.name}"?`} description="Kategori dengan paket tidak dapat dihapus. Pindahkan paket terlebih dahulu." onConfirm={async () => { try { await adminApi.delete(`/categories/${del.id}`); toast.success("Kategori dihapus"); refresh(); } catch (err) { toast.error(apiError(err)); } }} />
    </div>
  );
}
