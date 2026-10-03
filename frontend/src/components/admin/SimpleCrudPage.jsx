import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog, PageHeader } from "@/components/admin/Common";
import { renderField } from "@/components/admin/SettingsForm";
import { EmptyState } from "@/components/public/States";

export function SimpleCrudPage({ title, description, endpoint, queryKey, columns, fields, defaults = {}, reorderable = false, itemName = "Data", invalidate = [], renderRowExtra }) {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: async () => (await adminApi.get(endpoint)).data });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [del, setDel] = useState(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: [queryKey] }); invalidate.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); };
  const save = useMutation({
    mutationFn: async () => (editing?.id ? adminApi.put(`${endpoint}/${editing.id}`, form) : adminApi.post(endpoint, form)),
    onSuccess: () => { toast.success(`${itemName} disimpan`); setEditing(null); refresh(); },
    onError: (e) => toast.error(apiError(e)),
  });
  const reorder = async (i, d) => {
    const next = [...rows]; const [item] = next.splice(i, 1); next.splice(i + d, 0, item);
    try { await adminApi.patch(`${endpoint}/reorder`, { ids: next.map((r) => r.id) }); refresh(); } catch (e) { toast.error(apiError(e)); }
  };
  const open = (row) => { setEditing(row || {}); setForm(row ? { ...row } : { ...defaults }); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div data-testid={`crud-page-${queryKey}`}>
      <PageHeader title={title} description={description} actions={<button onClick={() => open(null)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="crud-add-button"><Plus className="h-4 w-4" /> Tambah</button>} />
      <div className="admin-surface p-0">
        {isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : rows.length === 0 ? <EmptyState title={`Belum ada ${itemName.toLowerCase()}`} className="border-0" /> : (
          <ul className="divide-y" data-testid="crud-list">
            {rows.map((r, i) => (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" data-testid={`crud-row-${r.id}`}>
                <div className="min-w-0 flex-1">{columns(r)}</div>
                {renderRowExtra && renderRowExtra(r, refresh)}
                <div className="flex shrink-0 gap-1">
                  {reorderable && <><button onClick={() => reorder(i, -1)} disabled={i === 0} className="rounded-md border p-2 disabled:opacity-30" aria-label="Naik"><ArrowUp className="h-3.5 w-3.5" /></button><button onClick={() => reorder(i, 1)} disabled={i === rows.length - 1} className="rounded-md border p-2 disabled:opacity-30" aria-label="Turun"><ArrowDown className="h-3.5 w-3.5" /></button></>}
                  <button onClick={() => open(r)} className="rounded-md border p-2 hover:text-primary" aria-label="Edit" data-testid={`crud-edit-${r.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDel(r)} className="rounded-md border p-2 text-destructive" aria-label="Hapus" data-testid={`crud-delete-${r.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" data-testid="crud-dialog">
          <DialogHeader><DialogTitle>{editing?.id ? `Edit ${itemName}` : `Tambah ${itemName}`}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 md:grid-cols-2">
            {fields.map((f) => renderField(f, form[f.key], set, "crud"))}
            <div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">Batal</button><button type="submit" disabled={save.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="crud-save-button">{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Simpan</button></div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Hapus ${itemName.toLowerCase()} ini?`} onConfirm={async () => { try { await adminApi.delete(`${endpoint}/${del.id}`); toast.success("Dihapus"); refresh(); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}
