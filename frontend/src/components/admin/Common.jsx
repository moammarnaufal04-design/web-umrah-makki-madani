import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { downloadExport } from "@/lib/api";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, testId = "page-header" }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-testid={testId}>
      <div><h1 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = "primary", testId }) {
  const tones = { primary: "bg-primary/10 text-primary", gold: "bg-gold-100 text-gold-700", navy: "bg-navy-900 text-white", rose: "bg-rose-50 text-rose-600", emerald: "bg-emerald-50 text-emerald-600" };
  return (
    <div className="admin-surface flex items-start gap-4" data-testid={testId}>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0"><div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 truncate font-sans text-2xl font-bold" data-testid={testId ? `${testId}-value` : undefined}>{value}</div>{hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}</div>
    </div>
  );
}

export function ConfirmDialog({ open, onOpenChange, title = "Hapus data ini?", description = "Tindakan ini tidak dapat dibatalkan.", confirmLabel = "Hapus", onConfirm, destructive = true }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => { setBusy(true); try { await onConfirm(); onOpenChange(false); } finally { setBusy(false); } };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="confirm-dialog">
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="confirm-cancel">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); confirm(); }} disabled={busy} className={cn(destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")} data-testid="confirm-accept">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ExportButtons({ entity, params = {} }) {
  const [busy, setBusy] = useState("");
  const run = async (format) => { setBusy(format); try { await downloadExport(entity, { ...params, format }); toast.success(`Export ${format.toUpperCase()} berhasil`); } catch (e) { toast.error(e.message); } finally { setBusy(""); } };
  return (
    <div className="flex gap-2">
      {["csv", "xlsx"].map((f) => <button key={f} onClick={() => run(f)} disabled={!!busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-60" data-testid={`export-${f}-button`}>{busy === f ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{f.toUpperCase()}</button>)}
    </div>
  );
}

export function Toolbar({ children, className }) {
  return <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export const AdminButton = ({ className, variant = "primary", size = "md", ...props }) => (
  <button className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-60", size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm", variant === "primary" && "bg-primary text-primary-foreground hover:bg-tosca-800", variant === "outline" && "border bg-card hover:border-primary hover:text-primary", variant === "ghost" && "hover:bg-muted", variant === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90", className)} {...props} />
);
