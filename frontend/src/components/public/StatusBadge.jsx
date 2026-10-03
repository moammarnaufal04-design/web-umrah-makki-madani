import { cn } from "@/lib/utils";

export function StatusBadge({ status, map, className, size = "sm", testId }) {
  const meta = map?.[status] || { label: status || "-", className: "bg-slate-100 text-slate-700 border-slate-200" };
  return (
    <span data-testid={testId || `status-badge-${String(status || "").toLowerCase()}`} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold tracking-wide", size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs", meta.className, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}
