import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Field({ label, hint, error, children, className, required }) {
  return (
    <div className={className}>
      {label && <label className="field-label">{label}{required && <span className="text-destructive"> *</span>}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export const TextField = ({ label, value, onChange, hint, error, type = "text", testId, className, ...props }) => (
  <Field label={label} hint={hint} error={error} className={className} required={props.required}>
    <Input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} data-testid={testId} {...props} />
  </Field>
);

export const TextareaField = ({ label, value, onChange, hint, error, rows = 3, testId, className, ...props }) => (
  <Field label={label} hint={hint} error={error} className={className} required={props.required}>
    <Textarea rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} data-testid={testId} {...props} />
  </Field>
);

export const SelectField = ({ label, value, onChange, options = [], placeholder = "Pilih", hint, error, testId, className, allowEmpty, emptyLabel = "— Tidak ada —" }) => (
  <Field label={label} hint={hint} error={error} className={className}>
    <Select value={value ?? ""} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger data-testid={testId}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value="__none__">{emptyLabel}</SelectItem>}
        {options.map((o) => <SelectItem key={o.value} value={o.value} data-testid={testId ? `${testId}-option-${o.value}` : undefined}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </Field>
);

export const SwitchField = ({ label, value, onChange, hint, testId, className }) => (
  <div className={cn("flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3", className)}>
    <div><div className="text-sm font-medium">{label}</div>{hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}</div>
    <Switch checked={!!value} onCheckedChange={onChange} data-testid={testId} />
  </div>
);

export function ListEditor({ label, value = [], onChange, placeholder = "Tambah item", hint, className, testId = "list-editor" }) {
  const update = (i, v) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i, d) => { const next = [...value]; const [item] = next.splice(i, 1); next.splice(i + d, 0, item); onChange(next); };
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="space-y-2" data-testid={testId}>
        {value.map((v, i) => (
          <div key={i} className="flex gap-2">
            <Input value={v} onChange={(e) => update(i, e.target.value)} data-testid={`${testId}-item-${i}`} />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md border px-2 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded-md border px-2 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-md border px-2 text-destructive" data-testid={`${testId}-remove-${i}`}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, ""])} className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5" data-testid={`${testId}-add`}><Plus className="h-3.5 w-3.5" /> {placeholder}</button>
      </div>
    </Field>
  );
}

export function ObjectListEditor({ label, value = [], onChange, fields, itemLabel = "Item", hint, className, testId = "object-list" }) {
  const update = (i, k, v) => onChange(value.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const move = (i, d) => { const next = [...value]; const [item] = next.splice(i, 1); next.splice(i + d, 0, item); onChange(next); };
  const empty = Object.fromEntries(fields.map((f) => [f.key, f.type === "list" ? [] : ""]));
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="space-y-3" data-testid={testId}>
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>{itemLabel} {i + 1}</span><div className="flex gap-1"><button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded border px-1.5 py-0.5 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button><button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded border px-1.5 py-0.5 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button><button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded border px-1.5 py-0.5 text-destructive" data-testid={`${testId}-remove-${i}`}><Trash2 className="h-3 w-3" /></button></div></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((f) => f.type === "textarea" ? <TextareaField key={f.key} label={f.label} rows={2} value={item[f.key]} onChange={(v) => update(i, f.key, v)} className="sm:col-span-2" testId={`${testId}-${i}-${f.key}`} />
                : f.type === "image" ? <ImageFieldLazy key={f.key} label={f.label} value={item[f.key]} onChange={(v) => update(i, f.key, v)} className="sm:col-span-2" />
                : f.type === "list" ? <ListEditor key={f.key} label={f.label} value={item[f.key] || []} onChange={(v) => update(i, f.key, v)} testId={`${testId}-${i}-${f.key}`} />
                : <TextField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => update(i, f.key, v)} className={f.full ? "sm:col-span-2" : ""} testId={`${testId}-${i}-${f.key}`} />)}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, empty])} className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5" data-testid={`${testId}-add`}><Plus className="h-3.5 w-3.5" /> Tambah {itemLabel}</button>
      </div>
    </Field>
  );
}

// Lazy import to avoid circular dependency with MediaPicker
import { ImageField } from "@/components/admin/MediaPicker";
const ImageFieldLazy = (props) => <ImageField {...props} />;
