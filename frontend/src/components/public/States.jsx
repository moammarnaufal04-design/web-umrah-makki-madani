import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon = Inbox, title = "Belum ada data", description, action, className, testId = "empty-state" }) {
  return (
    <div data-testid={testId} className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
      <h3 className="font-sans text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Terjadi kesalahan", description = "Data tidak dapat dimuat. Silakan coba lagi.", onRetry, testId = "error-state" }) {
  return (
    <div data-testid={testId} className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-14 text-center dark:border-rose-900 dark:bg-rose-950/30">
      <h3 className="font-sans text-base font-semibold text-rose-700 dark:text-rose-300">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline mt-5" data-testid="error-retry-button">Coba lagi</button>}
    </div>
  );
}
