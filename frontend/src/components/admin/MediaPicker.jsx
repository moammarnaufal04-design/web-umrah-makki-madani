import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Image as ImageIcon, Loader2, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminApi, apiError, uploadMedia } from "@/lib/api";
import { Field } from "@/components/admin/Fields";
import { cn } from "@/lib/utils";

export function MediaPicker({ open, onOpenChange, onSelect, folder = "general", accept = "image" }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const { data, isLoading } = useQuery({ queryKey: ["media", "picker", q, accept], queryFn: async () => (await adminApi.get("/media", { params: { q: q || undefined, type: accept === "any" ? undefined : accept, limit: 60 } })).data, enabled: open });
  const upload = async (files) => {
    setUploading(true);
    try {
      let last;
      for (const f of files) last = await uploadMedia(f, folder);
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${files.length} file diunggah`);
      if (last && files.length === 1) { onSelect(last); onOpenChange(false); }
    } catch (e) { toast.error(apiError(e)); } finally { setUploading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl" data-testid="media-picker">
        <DialogHeader><DialogTitle>Pilih Media</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari media…" className="pl-9" data-testid="media-picker-search" /></div>
          <input ref={inputRef} type="file" multiple accept={accept === "pdf" ? "application/pdf" : accept === "any" ? "image/*,application/pdf,video/mp4" : "image/*"} className="hidden" onChange={(e) => e.target.files.length && upload([...e.target.files])} data-testid="media-picker-file-input" />
          <button onClick={() => inputRef.current.click()} disabled={uploading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="media-picker-upload">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Unggah baru</button>
        </div>
        <div className="scrollbar-thin -mx-1 max-h-[55vh] overflow-y-auto p-1">
          {isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !data?.items?.length ? <p className="py-10 text-center text-sm text-muted-foreground">Belum ada media. Unggah file pertama Anda.</p> : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {data.items.map((m) => (
                <button key={m.id} onClick={() => { onSelect(m); onOpenChange(false); }} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted hover:ring-2 hover:ring-primary" data-testid={`media-picker-item-${m.id}`}>
                  {m.mime_type.startsWith("image/") ? <img src={m.thumb_url || m.url} alt={m.alt_text || m.original_name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground"><FileText className="h-6 w-6" /><span className="px-1 text-[10px] line-clamp-2">{m.original_name}</span></div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImageField({ label, value, onChange, hint, folder = "general", accept = "image", className, testId = "image-field" }) {
  const [open, setOpen] = useState(false);
  const isImage = value && !/\.pdf($|\?)/i.test(value);
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="flex gap-3" data-testid={testId}>
        <div className={cn("flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted", !value && "border-dashed")}>
          {value ? (isImage ? <img src={value} alt="" className="h-full w-full object-cover" /> : <FileText className="h-6 w-6 text-muted-foreground" />) : <ImageIcon className="h-6 w-6 text-muted-foreground/60" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL atau pilih dari Media Library" data-testid={`${testId}-url`} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(true)} className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary" data-testid={`${testId}-pick`}>Pilih / Unggah</button>
            {value && <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-destructive" data-testid={`${testId}-clear`}><X className="h-3 w-3" /> Hapus</button>}
          </div>
        </div>
      </div>
      <MediaPicker open={open} onOpenChange={setOpen} onSelect={(m) => onChange(m.url)} folder={folder} accept={accept} />
    </Field>
  );
}
