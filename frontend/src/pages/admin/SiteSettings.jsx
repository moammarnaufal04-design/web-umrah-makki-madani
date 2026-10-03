import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsForm } from "@/components/admin/SettingsForm";

export function GeneralSettings() {
  return (
    <Tabs defaultValue="brand" data-testid="general-settings-tabs">
      <TabsList className="mb-6 flex-wrap">
        <TabsTrigger value="brand" data-testid="tab-brand">Brand & Logo</TabsTrigger>
        <TabsTrigger value="theme" data-testid="tab-theme">Warna Tema</TabsTrigger>
        <TabsTrigger value="footer" data-testid="tab-footer">Footer</TabsTrigger>
        <TabsTrigger value="general" data-testid="tab-general">Umum</TabsTrigger>
      </TabsList>
      <TabsContent value="brand">
        <SettingsForm settingKey="brand" title="Brand & Logo" description="Identitas yang tampil di navbar, footer, dan metadata." fields={[
          { key: "name", label: "Nama brand" },
          { key: "short_name", label: "Nama singkat" },
          { key: "legal_name", label: "Nama badan hukum" },
          { key: "founded_year", label: "Tahun berdiri", type: "number" },
          { key: "tagline", label: "Tagline", full: true },
          { key: "logo_url", label: "Logo (terang)", type: "image", folder: "logo" },
          { key: "logo_dark_url", label: "Logo (mode gelap)", type: "image", folder: "logo" },
          { key: "favicon_url", label: "Favicon", type: "image", folder: "logo" },
        ]} />
      </TabsContent>
      <TabsContent value="theme">
        <SettingsForm settingKey="theme" title="Warna Tema" description="Warna utama website. Default Biru Tosca #0F766E." fields={[
          { key: "primary", label: "Warna utama (primary)", type: "color" },
          { key: "primary_dark", label: "Warna utama gelap", type: "color" },
          { key: "primary_light", label: "Warna utama terang", type: "color" },
          { key: "accent", label: "Warna aksen (emas)", type: "color" },
          { key: "navy", label: "Warna navy", type: "color" },
          { key: "dark_mode_enabled", label: "Izinkan mode gelap", type: "toggle" },
        ]} />
      </TabsContent>
      <TabsContent value="footer">
        <SettingsForm settingKey="footer" title="Footer" description="Deskripsi, tautan cepat, dan newsletter di bagian bawah website." fields={[
          { key: "description", label: "Deskripsi singkat", type: "textarea", rows: 3, full: true },
          { key: "copyright", label: "Teks hak cipta", full: true, hint: "Gunakan {year} untuk tahun otomatis." },
          { key: "show_newsletter", label: "Tampilkan form newsletter", type: "toggle" },
          { key: "newsletter_title", label: "Judul newsletter" },
          { key: "quick_links", label: "Tautan cepat", type: "objects", itemLabel: "Tautan", full: true, fields: [{ key: "label", label: "Label" }, { key: "href", label: "URL" }] },
        ]} />
      </TabsContent>
      <TabsContent value="general">
        <SettingsForm settingKey="general" title="Pengaturan Umum" description="Pengumuman situs dan integrasi analitik." fields={[
          { key: "show_announcement", label: "Tampilkan bar pengumuman", type: "toggle" },
          { key: "announcement", label: "Teks pengumuman", full: true },
          { key: "google_analytics_id", label: "Google Analytics ID", placeholder: "G-XXXXXXX" },
          { key: "currency", label: "Mata uang", type: "select", options: [{ value: "IDR", label: "IDR (Rupiah)" }] },
        ]} />
      </TabsContent>
    </Tabs>
  );
}

export function SeoSettings() {
  return (
    <SettingsForm settingKey="seo" title="SEO" description="Judul, deskripsi, dan kata kunci default untuk mesin pencari." fields={[
      { key: "site_url", label: "URL situs (canonical)", placeholder: "https://makkimadani.com", full: true },
      { key: "default_title", label: "Judul default", full: true },
      { key: "title_suffix", label: "Akhiran judul halaman", placeholder: " | Makki Madani Tour & Travel" },
      { key: "twitter_handle", label: "Akun Twitter/X", placeholder: "@makkimadani" },
      { key: "default_description", label: "Deskripsi default", type: "textarea", rows: 3, full: true },
      { key: "og_image_url", label: "Gambar berbagi (OG Image)", type: "image", folder: "seo", full: true },
      { key: "keywords", label: "Kata kunci", type: "list", placeholder: "Tambah kata kunci", full: true },
      { key: "locations", label: "Lokasi target SEO", type: "list", placeholder: "Tambah lokasi" },
      { key: "google_site_verification", label: "Google Site Verification" },
    ]} />
  );
}

export function WhatsAppSettings() {
  return (
    <SettingsForm settingKey="whatsapp" title="WhatsApp" description="Nomor tujuan dan template pesan otomatis untuk tombol WhatsApp dan formulir pendaftaran." sections={[
      { title: "Nomor & Tombol", fields: [
        { key: "number", label: "Nomor WhatsApp", placeholder: "0822xxxxxxx" },
        { key: "cta_label", label: "Label tombol", placeholder: "Konsultasi Sekarang" },
        { key: "group_url", label: "Link grup WhatsApp (opsional)", full: true },
        { key: "registration_form_name", label: "Nama form pendaftaran" },
      ] },
      { title: "Template Pesan", fields: [
        { key: "default_message", label: "Pesan default (tombol konsultasi)", type: "textarea", rows: 3, full: true },
        { key: "package_template", label: "Template pesan paket", type: "textarea", rows: 3, full: true, hint: "Variabel: {paket}, {tanggal}" },
        { key: "registration_template", label: "Template pesan pendaftaran", type: "textarea", rows: 8, full: true, hint: "Variabel: {layanan}, {nama}, {wa}, {paket}, {rencana}, {catatan}, {form}, {url}" },
      ] },
    ]} />
  );
}

export function LegalSettings() {
  return (
    <SettingsForm settingKey="legal" title="Legal" description="Informasi perizinan, kebijakan privasi, dan syarat & ketentuan. Isi hanya data yang sudah terverifikasi." sections={[
      { title: "Perizinan", fields: [
        { key: "ppiu", label: "Nomor izin PPIU" },
        { key: "pihk", label: "Nomor izin PIHK" },
        { key: "nib", label: "NIB" },
        { key: "npwp", label: "NPWP" },
        { key: "company_legal", label: "Legalitas perusahaan", type: "textarea", rows: 2, full: true },
        { key: "notes", label: "Catatan legal (tampil di website)", type: "textarea", rows: 3, full: true },
      ] },
      { title: "Dokumen", fields: [
        { key: "privacy_policy", label: "Kebijakan Privasi", type: "richtext" },
        { key: "terms", label: "Syarat & Ketentuan", type: "richtext" },
      ] },
    ]} />
  );
}
