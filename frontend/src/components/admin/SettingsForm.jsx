import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { ListEditor, ObjectListEditor, SelectField, SwitchField, TextField, TextareaField } from "@/components/admin/Fields";
import { ImageField } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { PageHeader } from "@/components/admin/Common";

export function renderField(f, value, set, prefix = "setting") {
  const common = { key: f.key, label: f.label, hint: f.hint, className: f.full ? "md:col-span-2" : "", testId: `${prefix}-${f.key}` };
  switch (f.type) {
    case "textarea": return <TextareaField {...common} rows={f.rows || 3} value={value} onChange={(v) => set(f.key, v)} />;
    case "number": return <TextField {...common} type="number" value={value} onChange={(v) => set(f.key, v)} />;
    case "toggle": return <SwitchField {...common} value={value} onChange={(v) => set(f.key, v)} className={common.className} />;
    case "image": return <ImageField {...common} value={value} onChange={(v) => set(f.key, v)} folder={f.folder || "general"} accept={f.accept || "image"} />;
    case "list": return <ListEditor {...common} value={value || []} onChange={(v) => set(f.key, v)} placeholder={f.placeholder || "Tambah"} />;
    case "objects": return <ObjectListEditor {...common} value={value || []} onChange={(v) => set(f.key, v)} fields={f.fields} itemLabel={f.itemLabel} />;
    case "select": return <SelectField {...common} value={value} onChange={(v) => set(f.key, v)} options={f.options} />;
    case "richtext": return <div key={f.key} className="md:col-span-2"><label className="field-label">{f.label}</label><RichTextEditor value={value || ""} onChange={(v) => set(f.key, v)} testId={`${prefix}-${f.key}`} /></div>;
    case "color": return (
      <div key={f.key} className={common.className}><label className="field-label">{f.label}</label><div className="flex gap-2"><input type="color" value={value || "#000000"} onChange={(e) => set(f.key, e.target.value)} className="h-9 w-12 cursor-pointer rounded border" data-testid={`${prefix}-${f.key}`} /><TextField value={value} onChange={(v) => set(f.key, v)} className="flex-1" /></div>{f.hint && <p className="mt-1 text-[11px] text-muted-foreground">{f.hint}</p>}</div>
    );
    default: return <TextField {...common} value={value} onChange={(v) => set(f.key, v)} placeholder={f.placeholder} />;
  }
}

export function SettingsForm({ settingKey, title, description, fields, sections }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: async () => (await adminApi.get("/settings")).data });
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && form === null) setForm(data[settingKey] || {}); }, [data, settingKey, form]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await adminApi.put(`/settings/${settingKey}`, { value: form });
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast.success("Pengaturan disimpan dan langsung tampil di website");
    } catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };
  if (isLoading || form === null) return <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const groups = sections || [{ title: null, fields }];
  return (
    <div data-testid={`settings-form-${settingKey}`}>
      <PageHeader title={title} description={description} actions={<button onClick={save} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="settings-save-button">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan</button>} />
      <div className="space-y-6">
        {groups.map((g, i) => (
          <div key={i} className="admin-surface">
            {g.title && <h2 className="mb-4 font-sans text-base font-bold">{g.title}</h2>}
            <div className="grid gap-4 md:grid-cols-2">{g.fields.map((f) => renderField(f, form[f.key], set))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
