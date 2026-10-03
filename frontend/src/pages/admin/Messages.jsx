import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { waLink, formatDateTime } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog, PageHeader, Toolbar } from "@/components/admin/Common";

function ContactMessages() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [del, setDel] = useState(null);
  const params = { status: status === "ALL" ? undefined : status, page, limit: 20 };
  const { data, isLoading } = useQuery({ queryKey: ["contact-messages", params], queryFn: async () => (await adminApi.get("/contact-messages", { params })).data, keepPreviousData: true });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["contact-messages"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); };
  const handle = async (m) => { try { await adminApi.patch(`/contact-messages/${m.id}`, { status: m.status === "NEW" ? "HANDLED" : "NEW" }); refresh(); } catch (e) { toast.error(apiError(e)); } };
  const columns = [
    { key: "name", label: "Pengirim", render: (m) => <div><div className="font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.whatsapp}{m.email ? ` · ${m.email}` : ""}</div></div> },
    { key: "message", label: "Pesan", render: (m) => <div className="max-w-md"><div className="text-xs font-semibold">{m.subject || m.package_interest || "-"}</div><p className="line-clamp-2 text-xs text-muted-foreground">{m.message}</p></div> },
    { key: "created_at", label: "Diterima", render: (m) => <span className="whitespace-nowrap text-xs">{formatDateTime(m.created_at)}</span> },
    { key: "status", label: "Status", render: (m) => <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${m.status === "NEW" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`} data-testid={`message-status-${m.id}`}>{m.status === "NEW" ? "Baru" : "Ditangani"}</span> },
    { key: "actions", label: "", render: (m) => <div className="flex gap-1"><a href={waLink(m.whatsapp, `Assalamu'alaikum ${m.name}, terima kasih telah menghubungi Makki Madani.`)} target="_blank" rel="noopener noreferrer" className="rounded-md border p-1.5 text-[#25D366]" aria-label="Balas WhatsApp" data-testid={`message-wa-${m.id}`}><MessageCircle className="h-3.5 w-3.5" /></a><button onClick={() => handle(m)} className="rounded-md border p-1.5 hover:text-primary" aria-label="Tandai" data-testid={`message-toggle-${m.id}`}><Check className="h-3.5 w-3.5" /></button><button onClick={() => setDel(m)} className="rounded-md border p-1.5 text-destructive" aria-label="Hapus" data-testid={`message-delete-${m.id}`}><Trash2 className="h-3.5 w-3.5" /></button></div> },
  ];
  return (
    <div data-testid="contact-messages-panel">
      <Toolbar>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="w-40" data-testid="messages-filter-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua status</SelectItem><SelectItem value="NEW">Baru</SelectItem><SelectItem value="HANDLED">Ditangani</SelectItem></SelectContent></Select>
      </Toolbar>
      <DataTable columns={columns} rows={data?.items} loading={isLoading} meta={data} onPage={setPage} emptyTitle="Belum ada pesan masuk" testId="messages-table" />
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Hapus pesan ini?" onConfirm={async () => { try { await adminApi.delete(`/contact-messages/${del.id}`); toast.success("Pesan dihapus"); refresh(); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}

function Newsletter() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [del, setDel] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ["newsletter", page], queryFn: async () => (await adminApi.get("/newsletter", { params: { page, limit: 50 } })).data, keepPreviousData: true });
  const columns = [
    { key: "email", label: "Email", render: (s) => <span className="font-medium">{s.email}</span> },
    { key: "created_at", label: "Berlangganan sejak", render: (s) => <span className="text-xs">{formatDateTime(s.created_at)}</span> },
    { key: "actions", label: "", render: (s) => <button onClick={() => setDel(s)} className="rounded-md border p-1.5 text-destructive" aria-label="Hapus" data-testid={`newsletter-delete-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></button> },
  ];
  return (
    <div data-testid="newsletter-panel">
      <DataTable columns={columns} rows={data?.items} loading={isLoading} meta={data} onPage={setPage} emptyTitle="Belum ada pelanggan newsletter" testId="newsletter-table" />
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Hapus pelanggan ini?" onConfirm={async () => { try { await adminApi.delete(`/newsletter/${del.id}`); toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["newsletter"] }); } catch (e) { toast.error(apiError(e)); } }} />
    </div>
  );
}

export default function Messages() {
  return (
    <div data-testid="admin-messages-page">
      <PageHeader title="Pesan & Newsletter" description="Pesan dari formulir kontak dan daftar email pelanggan informasi paket." />
      <Tabs defaultValue="messages">
        <TabsList className="mb-4"><TabsTrigger value="messages" data-testid="tab-messages">Pesan Kontak</TabsTrigger><TabsTrigger value="newsletter" data-testid="tab-newsletter">Newsletter</TabsTrigger></TabsList>
        <TabsContent value="messages"><ContactMessages /></TabsContent>
        <TabsContent value="newsletter"><Newsletter /></TabsContent>
      </Tabs>
    </div>
  );
}
