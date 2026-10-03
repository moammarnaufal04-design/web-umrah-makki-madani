import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/public/States";
import { cn } from "@/lib/utils";

export function DataTable({ columns, rows = [], loading, meta, onPage, sort, order, onSort, selectable, selected = [], onSelect, emptyTitle = "Belum ada data", emptyDescription, rowKey = "id", testId = "data-table", onRowClick }) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r[rowKey]));
  const toggleAll = () => onSelect(allSelected ? selected.filter((id) => !rows.some((r) => r[rowKey] === id)) : [...new Set([...selected, ...rows.map((r) => r[rowKey])])]);
  const toggle = (id) => onSelect(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="admin-surface overflow-hidden p-0" data-testid={testId}>
      <div className="scrollbar-thin overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {selectable && <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Pilih semua" data-testid={`${testId}-select-all`} /></TableHead>}
              {columns.map((c) => (
                <TableHead key={c.key} className={cn("whitespace-nowrap text-xs font-semibold uppercase tracking-wider", c.className)}>
                  {c.sortable && onSort ? (
                    <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 hover:text-primary" data-testid={`${testId}-sort-${c.key}`}>{c.label}{sort === c.key ? (order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}</button>
                  ) : c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-40 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="p-6"><EmptyState title={emptyTitle} description={emptyDescription} className="border-0 bg-transparent py-8" /></TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r[rowKey]} data-testid={`${testId}-row-${r[rowKey]}`} className={cn(onRowClick && "cursor-pointer", selected.includes(r[rowKey]) && "bg-primary/5")} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                {selectable && <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.includes(r[rowKey])} onCheckedChange={() => toggle(r[rowKey])} data-testid={`${testId}-select-${r[rowKey]}`} /></TableCell>}
                {columns.map((c) => <TableCell key={c.key} className={cn("text-sm", c.cellClassName)} onClick={c.stopPropagation ? (e) => e.stopPropagation() : undefined}>{c.render ? c.render(r) : r[c.key] ?? "-"}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground" data-testid={`${testId}-pagination`}>
          <span>Halaman {meta.page} dari {meta.pages} · {meta.total} data</span>
          <div className="flex gap-1">
            <button disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} className="rounded-md border p-1.5 disabled:opacity-40" aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)} className="rounded-md border p-1.5 disabled:opacity-40" aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
