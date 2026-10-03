import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListEditor, ObjectListEditor, SelectField, SwitchField, TextField, TextareaField } from "@/components/admin/Fields";
import { ImageField } from "@/components/admin/MediaPicker";
import { StatusBadge } from "@/components/public/StatusBadge";
import { PACKAGE_STATUS, formatRupiah } from "@/lib/format";

const EMPTY = {
  name: "", slug: "", category_id: "", product_type: "", short_description: "", full_description: "", is_featured: false,
  price: 0, dp_amount: 0, payment_notes: "", departure_date: "", return_date: "", duration_days: "", departure_airport: "", arrival_airport: "", airline: "", flight_info: "", route: "",
  makkah_hotel: "", makkah_hotel_rating: "", makkah_hotel_distance: "", madinah_hotel: "", madinah_hotel_rating: "", madinah_hotel_distance: "", room_type: "", other_accommodation: "",
  total_seats: 0, seats_filled: 0, limited_threshold: 5, status_override: "", is_active: true, is_published: false,
  flyer_url: "", hero_image_url: "", itinerary_file_url: "", extra_cities: [], notes: "", terms: "", booking_cta_label: "Daftar Paket", whatsapp_cta_label: "Konsultasi WhatsApp", whatsapp_message_template: "", seo_title: "", seo_description: "",
  itineraries: [], facilities_included: [], facilities_excluded: [], gallery: [], companions: [], faqs: [],
};

const toForm = (p) => ({ ...EMPTY, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v === null ? "" : v])), itineraries: p.itineraries?.map((i) => ({ day_number: i.day_number, title: i.title, description: i.description || "" })) || [], gallery: p.gallery?.map((g) => ({ image_url: g.image_url, caption: g.caption || "" })) || [], companions: p.companions?.map((c) => ({ name: c.name, title: c.title || "", bio: c.bio || "", photo_url: c.photo_url || "", quote: c.quote || "", profile_lines: c.profile_lines || [] })) || [], faqs: p.faqs?.map((f) => ({ question: f.question, answer: f.answer, is_active: true })) || [] });

const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export default function PackageForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const { data: cats = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await adminApi.get("/categories")).data });
  const { data: pkg, isLoading } = useQuery({ queryKey: ["admin-package", id], queryFn: async () => (await adminApi.get(`/packages/${id}`)).data, enabled: !isNew });
  useEffect(() => { if (pkg) setForm(toForm(pkg)); }, [pkg]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const remaining = Math.max((Number(form.total_seats) || 0) - (Number(form.seats_filled) || 0), 0);
  const autoStatus = !form.is_active ? "CLOSED" : remaining <= 0 ? "FULL" : remaining <= (Number(form.limited_threshold) || 0) ? "LIMITED_SEATS" : "AVAILABLE";

  const save = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (form.name.trim().length < 3) errs.name = "Nama minimal 3 karakter";
    if (!form.category_id) errs.category_id = "Pilih kategori";
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error("Periksa kembali isian wajib"); return; }
    setBusy(true);
    const payload = {
      ...form, slug: form.slug || null, price: Number(form.price) || 0, dp_amount: Number(form.dp_amount) || 0, total_seats: Number(form.total_seats) || 0, seats_filled: Number(form.seats_filled) || 0, limited_threshold: Number(form.limited_threshold) || 0,
      duration_days: numOrNull(form.duration_days), makkah_hotel_rating: numOrNull(form.makkah_hotel_rating), madinah_hotel_rating: numOrNull(form.madinah_hotel_rating),
      departure_date: form.departure_date || null, return_date: form.return_date || null, status_override: form.status_override || null,
      extra_cities: (form.extra_cities || []).filter(Boolean), facilities_included: form.facilities_included.filter(Boolean), facilities_excluded: form.facilities_excluded.filter(Boolean),
      itineraries: form.itineraries.filter((i) => i.title).map((i, idx) => ({ ...i, day_number: Number(i.day_number) || idx + 1 })), gallery: form.gallery.filter((g) => g.image_url), companions: form.companions.filter((c) => c.name), faqs: form.faqs.filter((f) => f.question && f.answer).map((f) => ({ ...f, is_active: true })),
    };
    ["product_type", "short_description", "full_description", "payment_notes", "departure_airport", "arrival_airport", "airline", "flight_info", "route", "makkah_hotel", "makkah_hotel_distance", "madinah_hotel", "madinah_hotel_distance", "room_type", "other_accommodation", "flyer_url", "hero_image_url", "itinerary_file_url", "notes", "terms", "booking_cta_label", "whatsapp_cta_label", "whatsapp_message_template", "seo_title", "seo_description"].forEach((k) => { if (payload[k] === "") payload[k] = null; });
    try {
      const { data } = isNew ? await adminApi.post("/packages", payload) : await adminApi.put(`/packages/${id}`, payload);
      toast.success(isNew ? "Paket dibuat" : "Paket disimpan");
      qc.invalidateQueries({ queryKey: ["admin-packages"] }); qc.invalidateQueries({ queryKey: ["admin-package", id] }); qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (isNew) navigate(`/admin/products/packages/${data.id}`, { replace: true });
    } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };

  if (!isNew && isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const catOptions = cats.map((c) => ({ value: c.id, label: `${c.group_type} · ${c.name}` }));

  return (
    <form onSubmit={save} data-testid="package-form">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/admin/products/packages" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar paket</Link>
          <h1 className="mt-2 font-sans text-2xl font-bold tracking-tight sm:text-3xl">{isNew ? "Paket Baru" : form.name || "Edit Paket"}</h1>
          {!isNew && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="font-mono">{pkg?.code}</span><StatusBadge status={form.status_override || autoStatus} map={PACKAGE_STATUS} /><span>Sisa {remaining} kursi</span>{pkg?.slug && <Link to={`/packages/${pkg.slug}`} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Lihat halaman</Link>}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <SwitchField label="Publikasikan" value={form.is_published} onChange={(v) => set("is_published", v)} className="!py-2" testId="package-published-switch" />
          <SwitchField label="Aktif" value={form.is_active} onChange={(v) => set("is_active", v)} className="!py-2" testId="package-active-switch" />
          <button type="submit" disabled={busy} className="inline-flex h-[46px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="package-save-button">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Paket</button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="scrollbar-thin mb-4 flex h-auto w-full justify-start overflow-x-auto bg-card p-1">
          {[["info", "Informasi"], ["harga", "Harga & Jadwal"], ["akomodasi", "Akomodasi"], ["kuota", "Kuota & Status"], ["konten", "Fasilitas & Itinerary"], ["pendamping", "Pendamping & FAQ"], ["media", "Media"], ["seo", "CTA & SEO"]].map(([v, l]) => <TabsTrigger key={v} value={v} data-testid={`package-tab-${v}`} className="shrink-0">{l}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="info" className="admin-surface grid gap-4 md:grid-cols-2">
          <TextField label="Nama paket" required value={form.name} onChange={(v) => set("name", v)} error={errors.name} className="md:col-span-2" testId="package-name-input" />
          <SelectField label="Kategori produk" value={form.category_id} onChange={(v) => set("category_id", v)} options={catOptions} error={errors.category_id} testId="package-category-select" />
          <TextField label="Tipe produk" value={form.product_type} onChange={(v) => set("product_type", v)} placeholder="Misal: Umrah Pendampingan Tokoh" testId="package-type-input" />
          <TextField label="Slug URL" value={form.slug} onChange={(v) => set("slug", v)} hint="Kosongkan untuk otomatis dari nama" testId="package-slug-input" />
          <SwitchField label="Paket unggulan" value={form.is_featured} onChange={(v) => set("is_featured", v)} hint="Tampil lebih dulu di beranda" testId="package-featured-switch" />
          <TextareaField label="Deskripsi singkat" value={form.short_description} onChange={(v) => set("short_description", v)} rows={2} className="md:col-span-2" hint="Maks. 500 karakter, tampil di kartu paket" testId="package-short-desc-input" />
          <TextareaField label="Deskripsi lengkap (Program Overview)" value={form.full_description} onChange={(v) => set("full_description", v)} rows={6} className="md:col-span-2" testId="package-full-desc-input" />
          <ListEditor label="Kota tambahan / City tour" value={form.extra_cities} onChange={(v) => set("extra_cities", v)} placeholder="Tambah kota" testId="package-cities" />
        </TabsContent>

        <TabsContent value="harga" className="admin-surface grid gap-4 md:grid-cols-2">
          <TextField label="Harga (Rp)" type="number" value={form.price} onChange={(v) => set("price", v)} hint={formatRupiah(form.price)} testId="package-price-input" />
          <TextField label="DP (Rp)" type="number" value={form.dp_amount} onChange={(v) => set("dp_amount", v)} hint={`Sisa pelunasan: ${formatRupiah((Number(form.price) || 0) - (Number(form.dp_amount) || 0))}`} testId="package-dp-input" />
          <TextareaField label="Catatan pembayaran" value={form.payment_notes} onChange={(v) => set("payment_notes", v)} rows={2} className="md:col-span-2" testId="package-payment-notes" />
          <TextField label="Tanggal keberangkatan" type="date" value={form.departure_date} onChange={(v) => set("departure_date", v)} testId="package-departure-input" />
          <TextField label="Tanggal kembali" type="date" value={form.return_date} onChange={(v) => set("return_date", v)} testId="package-return-input" />
          <TextField label="Durasi (hari)" type="number" value={form.duration_days} onChange={(v) => set("duration_days", v)} testId="package-duration-input" />
          <TextField label="Maskapai" value={form.airline} onChange={(v) => set("airline", v)} testId="package-airline-input" />
          <TextField label="Bandara keberangkatan" value={form.departure_airport} onChange={(v) => set("departure_airport", v)} />
          <TextField label="Bandara tujuan" value={form.arrival_airport} onChange={(v) => set("arrival_airport", v)} />
          <TextField label="Rute" value={form.route} onChange={(v) => set("route", v)} placeholder="BTJ - JED" testId="package-route-input" />
          <TextareaField label="Informasi penerbangan" value={form.flight_info} onChange={(v) => set("flight_info", v)} rows={2} />
        </TabsContent>

        <TabsContent value="akomodasi" className="admin-surface grid gap-4 md:grid-cols-2">
          <TextField label="Hotel Makkah" value={form.makkah_hotel} onChange={(v) => set("makkah_hotel", v)} testId="package-makkah-hotel" />
          <TextField label="Hotel Madinah" value={form.madinah_hotel} onChange={(v) => set("madinah_hotel", v)} testId="package-madinah-hotel" />
          <TextField label="Bintang hotel Makkah (0-5)" type="number" value={form.makkah_hotel_rating} onChange={(v) => set("makkah_hotel_rating", v)} min={0} max={5} />
          <TextField label="Bintang hotel Madinah (0-5)" type="number" value={form.madinah_hotel_rating} onChange={(v) => set("madinah_hotel_rating", v)} min={0} max={5} />
          <TextField label="Jarak hotel Makkah" value={form.makkah_hotel_distance} onChange={(v) => set("makkah_hotel_distance", v)} placeholder="± 300 m dari Masjidil Haram" />
          <TextField label="Jarak hotel Madinah" value={form.madinah_hotel_distance} onChange={(v) => set("madinah_hotel_distance", v)} />
          <TextField label="Tipe kamar" value={form.room_type} onChange={(v) => set("room_type", v)} placeholder="Quad / Triple / Double" />
          <TextareaField label="Informasi akomodasi lain" value={form.other_accommodation} onChange={(v) => set("other_accommodation", v)} rows={2} />
        </TabsContent>

        <TabsContent value="kuota" className="admin-surface grid gap-4 md:grid-cols-2">
          <TextField label="Total kursi" type="number" value={form.total_seats} onChange={(v) => set("total_seats", v)} testId="package-total-seats-input" />
          <TextField label="Kursi terisi" type="number" value={form.seats_filled} onChange={(v) => set("seats_filled", v)} hint="Bertambah otomatis saat status pendaftaran menjadi Terdaftar" testId="package-seats-filled-input" />
          <TextField label="Ambang 'Sisa Sedikit'" type="number" value={form.limited_threshold} onChange={(v) => set("limited_threshold", v)} hint="Status LIMITED SEATS jika sisa ≤ nilai ini" testId="package-threshold-input" />
          <SelectField label="Override status publik" value={form.status_override || "AUTO"} onChange={(v) => set("status_override", v === "AUTO" ? "" : v)} options={[{ value: "AUTO", label: `Otomatis (${PACKAGE_STATUS[autoStatus].label})` }, ...Object.entries(PACKAGE_STATUS).map(([k, v]) => ({ value: k, label: `Manual: ${v.label}` }))]} testId="package-status-override" />
          <div className="rounded-lg border bg-muted/40 p-4 text-sm md:col-span-2" data-testid="package-quota-preview">
            <div className="flex flex-wrap items-center gap-4"><span>Sisa kursi: <strong data-testid="package-remaining-preview">{remaining}</strong></span><span>Status tampil: <StatusBadge status={form.status_override || autoStatus} map={PACKAGE_STATUS} /></span></div>
            <p className="mt-2 text-xs text-muted-foreground">remaining_seats = total_seats − seats_filled. Status otomatis: tersedia → sisa sedikit → penuh; paket nonaktif → ditutup.</p>
          </div>
        </TabsContent>

        <TabsContent value="konten" className="grid gap-6">
          <div className="admin-surface grid gap-4 md:grid-cols-2">
            <ListEditor label="Fasilitas termasuk" value={form.facilities_included} onChange={(v) => set("facilities_included", v)} placeholder="Tambah fasilitas" testId="package-included" />
            <ListEditor label="Tidak termasuk" value={form.facilities_excluded} onChange={(v) => set("facilities_excluded", v)} placeholder="Tambah item" testId="package-excluded" />
          </div>
          <div className="admin-surface"><ObjectListEditor label="Itinerary" value={form.itineraries} onChange={(v) => set("itineraries", v)} itemLabel="Hari" fields={[{ key: "day_number", label: "Hari ke-" }, { key: "title", label: "Judul" }, { key: "description", label: "Deskripsi", type: "textarea" }]} testId="package-itinerary" /></div>
          <div className="admin-surface grid gap-4 md:grid-cols-2"><TextareaField label="Catatan" value={form.notes} onChange={(v) => set("notes", v)} rows={3} /><TextareaField label="Syarat & ketentuan paket" value={form.terms} onChange={(v) => set("terms", v)} rows={3} /></div>
        </TabsContent>

        <TabsContent value="pendamping" className="grid gap-6">
          <div className="admin-surface"><ObjectListEditor label="Tokoh pendamping / pembimbing" value={form.companions} onChange={(v) => set("companions", v)} itemLabel="Pendamping" fields={[{ key: "name", label: "Nama" }, { key: "title", label: "Jabatan / peran" }, { key: "photo_url", label: "Foto", type: "image" }, { key: "bio", label: "Bio singkat", type: "textarea" }, { key: "quote", label: "Kutipan", type: "textarea" }, { key: "profile_lines", label: "Profil (baris)", type: "list" }]} testId="package-companions" /></div>
          <div className="admin-surface"><ObjectListEditor label="FAQ khusus paket" value={form.faqs} onChange={(v) => set("faqs", v)} itemLabel="FAQ" fields={[{ key: "question", label: "Pertanyaan", full: true }, { key: "answer", label: "Jawaban", type: "textarea" }]} testId="package-faqs" /></div>
        </TabsContent>

        <TabsContent value="media" className="grid gap-6">
          <div className="admin-surface grid gap-4 md:grid-cols-2">
            <ImageField label="Gambar utama (hero)" value={form.hero_image_url} onChange={(v) => set("hero_image_url", v)} folder="hero" testId="package-hero-image" />
            <ImageField label="Flyer (gambar/PDF)" value={form.flyer_url} onChange={(v) => set("flyer_url", v)} folder="flyer" accept="any" testId="package-flyer" />
            <ImageField label="File itinerary (PDF)" value={form.itinerary_file_url} onChange={(v) => set("itinerary_file_url", v)} folder="flyer" accept="pdf" testId="package-itinerary-file" />
          </div>
          <div className="admin-surface"><ObjectListEditor label="Galeri foto" value={form.gallery} onChange={(v) => set("gallery", v)} itemLabel="Foto" fields={[{ key: "image_url", label: "Gambar", type: "image" }, { key: "caption", label: "Keterangan", full: true }]} testId="package-gallery" /></div>
        </TabsContent>

        <TabsContent value="seo" className="admin-surface grid gap-4 md:grid-cols-2">
          <TextField label="Label tombol booking" value={form.booking_cta_label} onChange={(v) => set("booking_cta_label", v)} />
          <TextField label="Label tombol WhatsApp" value={form.whatsapp_cta_label} onChange={(v) => set("whatsapp_cta_label", v)} />
          <TextareaField label="Template pesan WhatsApp paket" value={form.whatsapp_message_template} onChange={(v) => set("whatsapp_message_template", v)} rows={3} className="md:col-span-2" hint="Placeholder: {paket}, {tanggal}, {harga}. Kosongkan untuk memakai template global." />
          <TextField label="SEO title" value={form.seo_title} onChange={(v) => set("seo_title", v)} className="md:col-span-2" testId="package-seo-title" />
          <TextareaField label="Meta description" value={form.seo_description} onChange={(v) => set("seo_description", v)} rows={2} className="md:col-span-2" hint="Maks. 160 karakter disarankan" testId="package-seo-description" />
        </TabsContent>
      </Tabs>
    </form>
  );
}
