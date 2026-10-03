import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, FileText, Loader2, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError, uploadMedia } from "@/lib/api";
import { ConfirmDialog, PageHeader, Toolbar } from "@/components/admin/Common";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TextField, SelectField } from "@/components/admin/Fields";
import { EmptyState } from "@/components/public/States";
import { formatDateTime } from "@/lib/format";

const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);

export default function Media() {
  const qc = useQueryClient();
  const [folder, setFolder] = useState("ALL");
  const [uploadFolder, setUploadFolder] = useState("general");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState(null);
  const [del, setDel] = useState(null);
  const inputRef = useRef();
  const replaceRef = useRef();
  const { data: folders = [] } = useQuery({ queryKey: ["media-folders"], queryFn: async () => (await adminApi.get("/media/folders")).data });
  const params = { folder: folder === "ALL" ? undefined : folder, q: q || undefined, page, limit: 40 };
  const { data, isLoading } = useQuery({ queryKey: ["media", params], queryFn: async () => (await adminApi.get("/media", { params })).data, keepPreviousData: true });
  const refresh = () => qc.invalidateQueries({ queryKey: ["media"] });
  const upload = async (files) => { setUploading(true); let ok = 0; for (const f of files) { try { await uploadMedia(f, uploadFolder); ok++; } catch (e) { toast.error(`${f.name}: ${apiError(e)}`); } } if (ok) toast.success(`${ok} file diunggah & dioptimalkan`); setUploading(false); refresh(); };
  const saveMeta = async () => { try { await adminApi.patch(`/media/${active.id}`, { alt_text: active.alt_text, folder: active.folder }); toast.success("Metadata disimpan"); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const replace = async (file) => { const form = new FormData(); form.append("file", file); try { const { data: m } = await adminApi.post(`/media/${active.id}/replace`, form); toast.success("File diganti. URL tetap sama di semua halaman."); setActive(m); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const copy = (url) => { navigator.clipboard.writeText(url); toast.success("URL disalin"); };
  return (
    <div data-testid="admin-media-page">
      <PageHeader title="Media Library" description="Pusat aset: logo, foto kantor, jamaah, Makkah, Madinah, hotel, flyer, wisata. Gambar dioptimalkan otomatis (WebP + thumbnail)." actions={<div className="flex items-center gap-2"><Select value={uploadFolder} onValueChange={setUploadFolder}><SelectTrigger className="w-36" data-testid="media-upload-folder"><SelectValue /></SelectTrigger><SelectContent>{folders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select><input ref={inputRef} type="file" multiple accept="image/*,application/pdf,video/mp4" className="hidden" onChange={(e) => e.target.files.length && upload([...e.target.files])} data-testid="media-file-input" /><button onClick={() => inputRef.current.click()} disabled={uploading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="media-upload-button">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Unggah</button></div>} />
      <Toolbar>
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari nama file / alt text…" className="pl-9" data-testid="media-search" /></div>
        <div className="scrollbar-thin flex gap-1 overflow-x-auto">{["ALL", ...folders].map((f) => <button key={f} onClick={() => { setFolder(f); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${folder === f ? "border-primary bg-primary/10 text-primary" : "hover:border-primary"}`} data-testid={`media-folder-${f}`}>{f === "ALL" ? "Semua" : f}</button>)}</div>
      </Toolbar>
      {isLoading ? <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !data?.items?.length ? <EmptyState title="Belum ada media" description="Unggah logo, foto, atau flyer untuk mulai mengganti placeholder di website." action={<button onClick={() => inputRef.current.click()} className="btn-primary !py-2 text-xs">Unggah file</button>} testId="media-empty" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" data-testid="media-grid">
            {data.items.map((m) => (
              <button key={m.id} onClick={() => setActive(m)} className="group admin-surface overflow-hidden p-0 text-left hover:ring-2 hover:ring-primary" data-testid={`media-item-${m.id}`}>
                <div className="aspect-square bg-muted">{m.mime_type.startsWith("image/") ? <img src={m.thumb_url || m.url} alt={m.alt_text || m.original_name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><FileText className="h-8 w-8" /></div>}</div>
                <div className="p-2"><div className="truncate text-xs font-medium">{m.original_name || m.file_name}</div><div className="text-[10px] text-muted-foreground">{m.folder} · {fmtSize(m.size_bytes)}{m.width && ` · ${m.width}×${m.height}`}</div></div>
              </button>
            ))}
          </div>
          {data.pages > 1 && <div className="mt-4 flex justify-center gap-2">{Array.from({ length: data.pages }).map((_, i) => <button key={i} onClick={() => setPage(i + 1)} className={`h-8 w-8 rounded-md border text-xs ${page === i + 1 ? "bg-primary text-primary-foreground" : ""}`}>{i + 1}</button>)}</div>}
        </>
      )}
      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="media-detail-dialog">
          {active && (
            <>
              <DialogHeader><DialogTitle className="truncate">{active.original_name || active.file_name}</DialogTitle></DialogHeader>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-center justify-center overflow-hidden rounded-lg border bg-muted">{active.mime_type.startsWith("image/") ? <img src={active.url} alt={active.alt_text || ""} className="max-h-72 w-full object-contain" /> : <a href={active.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-10 text-sm text-primary"><FileText className="h-10 w-10" /> Buka file</a>}</div>
                <div className="space-y-3 text-sm">
                  <TextField label="Alt text (SEO)" value={active.alt_text || ""} onChange={(v) => setActive({ ...active, alt_text: v })} testId="media-alt-input" />
                  <SelectField label="Folder" value={active.folder} onChange={(v) => setActive({ ...active, folder: v })} options={folders.map((f) => ({ value: f, label: f }))} />
                  <dl className="grid grid-cols-2 gap-1 text-xs text-muted-foreground"><dt>Tipe</dt><dd>{active.mime_type}</dd><dt>Ukuran</dt><dd>{fmtSize(active.size_bytes)}</dd>{active.width && <><dt>Dimensi</dt><dd>{active.width}×{active.height}</dd></>}<dt>Diunggah</dt><dd>{formatDateTime(active.created_at)}</dd></dl>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5"><span className="truncate text-[11px]">{active.url}</span><button onClick={() => copy(active.url)} className="shrink-0 rounded border bg-card p-1" aria-label="Salin URL" data-testid="media-copy-url"><Copy className="h-3 w-3" /></button></div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={saveMeta} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground" data-testid="media-save-meta">Simpan</button>
                    <input ref={replaceRef} type="file" className="hidden" onChange={(e) => e.target.files[0] && replace(e.target.files[0])} />
                    <button onClick={() => replaceRef.current.click()} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold" data-testid="media-replace-button"><RefreshCw className="h-3 w-3" /> Ganti file</button>
                    <button onClick={() => setDel(active)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-destructive" data-testid="media-delete-button"><Trash2 className="h-3 w-3" /> Hapus</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Hapus media ini?" description="File akan dihapus dari storage. Halaman yang masih memakai URL ini akan kehilangan gambarnya." onConfirm={async () => { try { await adminApi.delete(`/media/${del.id}`); toast.success("Media dihapus"); setActive(null); refresh(); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}
