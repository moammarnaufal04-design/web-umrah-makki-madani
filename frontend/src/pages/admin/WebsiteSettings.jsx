import { SettingsForm } from "@/components/admin/SettingsForm";

const PERSON_FIELDS = [{ key: "name", label: "Nama lengkap & gelar", full: true }, { key: "role", label: "Peran" }, { key: "photo_url", label: "Foto", type: "image" }];

export function AboutSettings() {
  return (
    <SettingsForm
      settingKey="about"
      title="Tentang Kami"
      description="Profil perusahaan, visi & misi, sejarah, nilai, pembina, dan penasihat yang tampil di halaman /about."
      sections={[
        { title: "Profil", fields: [
          { key: "profile", label: "Profil perusahaan", type: "textarea", rows: 5, full: true, hint: "Pisahkan paragraf dengan baris kosong." },
          { key: "history", label: "Sejarah singkat", type: "textarea", rows: 4, full: true },
          { key: "office_image_url", label: "Foto kantor", type: "image", folder: "office", full: true },
        ] },
        { title: "Visi & Misi", fields: [
          { key: "vision", label: "Visi", type: "textarea", rows: 3, full: true },
          { key: "mission", label: "Misi", type: "list", placeholder: "Tambah poin misi", full: true },
        ] },
        { title: "Nilai Perusahaan", fields: [{ key: "values", label: "Nilai", type: "objects", itemLabel: "Nilai", full: true, fields: [{ key: "title", label: "Judul" }, { key: "description", label: "Deskripsi", type: "textarea" }] }] },
        { title: "Pembina & Penasihat", fields: [
          { key: "pembina", label: "Pembina", type: "objects", itemLabel: "Pembina", full: true, fields: PERSON_FIELDS },
          { key: "penasihat", label: "Penasihat", type: "objects", itemLabel: "Penasihat", full: true, fields: PERSON_FIELDS },
        ] },
      ]}
    />
  );
}

export function ContactSettings() {
  return (
    <SettingsForm
      settingKey="contact"
      title="Kontak & Lokasi"
      description="Nomor WhatsApp, telepon, email, alamat kantor, dan peta yang tampil di footer serta halaman kontak."
      fields={[
        { key: "whatsapp", label: "Nomor WhatsApp utama", placeholder: "0822xxxxxxx", hint: "Format 08xx atau 62xx" },
        { key: "phone", label: "Telepon kantor" },
        { key: "email", label: "Email" },
        { key: "city", label: "Kota" },
        { key: "address", label: "Alamat lengkap", type: "textarea", rows: 3, full: true },
        { key: "office_hours", label: "Jam operasional", full: true },
        { key: "maps_link", label: "Link Google Maps", full: true },
        { key: "maps_embed_url", label: "URL embed Google Maps", full: true, hint: "Gunakan format https://www.google.com/maps?q=...&output=embed" },
        { key: "service_areas", label: "Area layanan", type: "list", placeholder: "Tambah area", full: true },
      ]}
    />
  );
}

export function SocialSettings() {
  return (
    <SettingsForm
      settingKey="social"
      title="Media Sosial"
      description="Tautan media sosial resmi yang tampil di footer dan halaman kontak."
      fields={[
        { key: "handle", label: "Nama akun (handle)", placeholder: "@makkimadani" },
        { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
        { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
        { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
        { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
      ]}
    />
  );
}
