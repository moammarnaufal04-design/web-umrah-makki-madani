import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/admin/Common";
import { SwitchField, TextField, TextareaField } from "@/components/admin/Fields";
import { renderField } from "@/components/admin/SettingsForm";

const SECTION_LABEL = { hero: "Hero (Banner Utama)", search: "Pencarian Paket", umrah: "Paket Umrah", haji: "Paket Haji", wisata: "Wisata Halal", why_us: "Kenapa Memilih Kami", promo: "Promo & Informasi", pembimbing: "Tokoh Pembimbing", testimonials: "Testimoni Jamaah", articles: "Artikel Terbaru", faq: "FAQ", cta: "Ajakan Konsultasi (CTA)" };

const CONTENT_FIELDS = {
  hero: [
    { key: "badge", label: "Badge kecil", placeholder: "Travel Umrah & Haji · Banda Aceh" },
    { key: "image_url", label: "Gambar hero", type: "image", folder: "hero", full: true },
    { key: "primary_cta_label", label: "Tombol utama (WhatsApp)" },
    { key: "secondary_cta_label", label: "Tombol kedua" },
    { key: "secondary_cta_link", label: "Link tombol kedua", placeholder: "/packages" },
    { key: "highlights", label: "Poin keunggulan", type: "objects", itemLabel: "Poin", full: true, fields: [{ key: "title", label: "Judul" }, { key: "description", label: "Deskripsi" }] },
  ],
  umrah: [{ key: "limit", label: "Jumlah paket ditampilkan", type: "number" }],
  haji: [{ key: "limit", label: "Jumlah paket ditampilkan", type: "number" }],
  wisata: [{ key: "limit", label: "Jumlah paket ditampilkan", type: "number" }],
  why_us: [{ key: "items", label: "Daftar keunggulan", type: "objects", itemLabel: "Keunggulan", full: true, fields: [{ key: "icon", label: "Ikon (nama lucide, mis. HeartHandshake)" }, { key: "title", label: "Judul" }, { key: "description", label: "Deskripsi", type: "textarea" }] }],
  promo: [
    { key: "badge", label: "Badge" },
    { key: "image_url", label: "Gambar latar", type: "image", folder: "promo", full: true },
    { key: "cta_label", label: "Label tombol" },
    { key: "cta_link", label: "Link tombol", placeholder: "/packages/umrah" },
    { key: "note", label: "Catatan internal", full: true },
  ],
  pembimbing: [{ key: "people", label: "Tokoh pembimbing", type: "objects", itemLabel: "Tokoh", full: true, fields: [{ key: "name", label: "Nama", full: true }, { key: "title", label: "Jabatan / peran", full: true }, { key: "photo_url", label: "Foto", type: "image" }, { key: "quote", label: "Kutipan", type: "textarea" }, { key: "lines", label: "Profil singkat (baris)", type: "list" }] }],
  articles: [{ key: "limit", label: "Jumlah artikel ditampilkan", type: "number" }],
  cta: [
    { key: "primary_cta_label", label: "Tombol utama (WhatsApp)" },
    { key: "secondary_cta_label", label: "Tombol kedua" },
    { key: "image_url", label: "Gambar latar", type: "image", folder: "hero", full: true },
  ],
};

function SectionDialog({ section, onClose, onSaved }) {
  const [form, setForm] = useState({ title: section.title || "", subtitle: section.subtitle || "", is_active: section.is_active, content: section.content || {} });
  const [busy, setBusy] = useState(false);
  const setContent = (k, v) => setForm((f) => ({ ...f, content: { ...f.content, [k]: v } }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await adminApi.put(`/homepage-sections/${section.key}`, form); toast.success("Section disimpan dan langsung tampil di beranda"); onSaved(); onClose(); } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  const fields = CONTENT_FIELDS[section.key] || [];
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="section-dialog">
        <DialogHeader><DialogTitle>Edit: {SECTION_LABEL[section.key] || section.key}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <TextField label="Judul" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} className="md:col-span-2" testId="section-title-input" />
          <TextareaField label="Subjudul" value={form.subtitle} onChange={(v) => setForm((f) => ({ ...f, subtitle: v }))} className="md:col-span-2" testId="section-subtitle-input" />
          {fields.map((f) => renderField(f, form.content[f.key], setContent, "section"))}
          <SwitchField label="Tampilkan di beranda" value={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} className="md:col-span-2" testId="section-active-switch" />
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Batal</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="section-save-button">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Homepage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["homepage-sections"], queryFn: async () => (await adminApi.get("/homepage-sections")).data });
  const [editing, setEditing] = useState(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["homepage-sections"] }); qc.invalidateQueries({ queryKey: ["site"] }); };
  const toggle = async (s) => { try { await adminApi.put(`/homepage-sections/${s.key}`, { title: s.title, subtitle: s.subtitle, content: s.content, is_active: !s.is_active }); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const move = async (i, d) => {
    const next = [...rows]; const [it] = next.splice(i, 1); next.splice(i + d, 0, it);
    try { await adminApi.patch("/homepage-sections/reorder", { ids: next.map((r) => r.id) }); refresh(); } catch (e) { toast.error(apiError(e)); }
  };
  return (
    <div data-testid="admin-homepage-page">
      <PageHeader title="Homepage" description="Atur urutan, isi, dan visibilitas setiap bagian beranda. Perubahan langsung tampil di website." />
      <div className="admin-surface p-0">
        {isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <ul className="divide-y" data-testid="homepage-sections-list">
            {rows.map((s, i) => (
              <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" data-testid={`section-row-${s.key}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${!s.is_active && "text-muted-foreground line-through"}`}>{SECTION_LABEL[s.key] || s.key}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.title || "—"}</div>
                </div>
                <Switch checked={s.is_active} onCheckedChange={() => toggle(s)} data-testid={`section-toggle-${s.key}`} />
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md border p-2 disabled:opacity-30" aria-label="Naik" data-testid={`section-up-${s.key}`}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="rounded-md border p-2 disabled:opacity-30" aria-label="Turun" data-testid={`section-down-${s.key}`}><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setEditing(s)} className="rounded-md border p-2 hover:text-primary" aria-label="Edit" data-testid={`section-edit-${s.key}`}><Pencil className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <SectionDialog section={editing} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}
