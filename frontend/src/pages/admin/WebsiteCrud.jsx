import { Star } from "lucide-react";
import { SimpleCrudPage } from "@/components/admin/SimpleCrudPage";

export function Testimonials() {
  return (
    <SimpleCrudPage
      title="Testimonials"
      description="Cerita jamaah yang tampil di beranda. Hapus atau ganti testimoni bertanda contoh dengan testimoni asli."
      endpoint="/testimonials"
      queryKey="testimonials-admin"
      itemName="Testimoni"
      reorderable
      invalidate={["testimonials", "site"]}
      defaults={{ name: "", origin: "", package_label: "", content: "", rating: 5, avatar_url: "", is_active: true, is_placeholder: false }}
      columns={(t) => (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">{t.avatar_url ? <img src={t.avatar_url} alt="" className="h-full w-full object-cover" /> : (t.name || "?").charAt(0)}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">{t.name}{t.is_placeholder && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">Contoh</span>}{!t.is_active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">Nonaktif</span>}</div>
            <div className="text-xs text-muted-foreground">{[t.origin, t.package_label].filter(Boolean).join(" · ")} · <span className="inline-flex items-center gap-0.5 text-gold-600"><Star className="h-3 w-3 fill-current" /> {t.rating}</span></div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.content}</p>
          </div>
        </div>
      )}
      fields={[
        { key: "name", label: "Nama jamaah" },
        { key: "origin", label: "Asal (kota)" },
        { key: "package_label", label: "Paket yang diikuti" },
        { key: "rating", label: "Rating (1–5)", type: "number" },
        { key: "content", label: "Isi testimoni", type: "textarea", rows: 4, full: true },
        { key: "avatar_url", label: "Foto jamaah (opsional)", type: "image", folder: "jamaah", full: true },
        { key: "is_active", label: "Tampilkan di website", type: "toggle" },
        { key: "is_placeholder", label: "Tandai sebagai contoh", type: "toggle", hint: "Testimoni contoh diberi label agar tidak dianggap asli." },
      ]}
    />
  );
}

export function Faqs() {
  return (
    <SimpleCrudPage
      title="FAQ"
      description="Pertanyaan umum yang tampil di beranda dan halaman /faq."
      endpoint="/faqs"
      queryKey="faqs-admin"
      itemName="FAQ"
      reorderable
      invalidate={["faqs"]}
      defaults={{ question: "", answer: "", category: "UMUM", is_active: true }}
      columns={(f) => (
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${!f.is_active && "text-muted-foreground line-through"}`}>{f.question}</div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{f.answer}</p>
          {f.category && <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{f.category}</span>}
        </div>
      )}
      fields={[
        { key: "question", label: "Pertanyaan", full: true },
        { key: "answer", label: "Jawaban", type: "textarea", rows: 4, full: true },
        { key: "category", label: "Kategori", type: "select", options: [{ value: "UMUM", label: "Umum" }, { value: "PENDAFTARAN", label: "Pendaftaran" }, { value: "PEMBAYARAN", label: "Pembayaran" }, { value: "DOKUMEN", label: "Dokumen" }, { value: "PERJALANAN", label: "Perjalanan" }] },
        { key: "is_active", label: "Tampilkan", type: "toggle" },
      ]}
    />
  );
}
