export const formatRupiah = (v) => (v === null || v === undefined || v === "" ? "-" : "Rp" + Math.round(Number(v)).toLocaleString("id-ID"));

export const formatDate = (iso, opts = {}) => {
  if (!iso) return "-";
  const d = typeof iso === "string" && iso.length === 10 ? new Date(iso + "T00:00:00") : new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", ...opts }).format(d);
};

export const formatDateShort = (iso) => formatDate(iso, { month: "short" });

export const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

export const normalizeWa = (number = "") => {
  let digits = String(number).replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits;
};

export const waLink = (number, message) => `https://wa.me/${normalizeWa(number)}?text=${encodeURIComponent(message || "")}`;

export const renderTemplate = (tpl = "", map = {}) => Object.entries(map).reduce((out, [k, v]) => out.split(`{${k}}`).join(v ?? "-"), tpl || "");

export const PACKAGE_STATUS = {
  AVAILABLE: { label: "Tersedia", className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" },
  LIMITED_SEATS: { label: "Sisa Sedikit", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300" },
  FULL: { label: "Penuh", className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300" },
  CLOSED: { label: "Ditutup", className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300" },
  SOLD_OUT: { label: "Habis", className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-slate-800 dark:text-slate-300" },
};

export const REG_STATUS = {
  NEW: { label: "Baru", className: "bg-sky-50 text-sky-700 border-sky-200" },
  CONTACTED: { label: "Dihubungi", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  CONSULTATION: { label: "Konsultasi", className: "bg-violet-50 text-violet-700 border-violet-200" },
  REGISTERED: { label: "Terdaftar", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-50 text-rose-700 border-rose-200" },
  COMPLETED: { label: "Selesai", className: "bg-teal-50 text-teal-800 border-teal-200" },
};

export const DOC_STATUS = {
  NOT_STARTED: { label: "Belum Mulai", className: "bg-slate-100 text-slate-700 border-slate-200" },
  IN_PROGRESS: { label: "Proses", className: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETE: { label: "Lengkap", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const PAY_STATUS = {
  UNPAID: { label: "Belum Bayar", className: "bg-slate-100 text-slate-700 border-slate-200" },
  DP_PAID: { label: "DP Lunas", className: "bg-sky-50 text-sky-700 border-sky-200" },
  PARTIALLY_PAID: { label: "Sebagian", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Lunas", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OVERDUE: { label: "Terlambat", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const ARTICLE_STATUS = {
  DRAFT: { label: "Draf", className: "bg-slate-100 text-slate-700 border-slate-200" },
  PUBLISHED: { label: "Terbit", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SCHEDULED: { label: "Terjadwal", className: "bg-sky-50 text-sky-700 border-sky-200" },
};

export const GENDER = { MALE: "Laki-laki", FEMALE: "Perempuan" };
export const GROUP_LABEL = { UMRAH: "Umrah", HAJI: "Haji", WISATA: "Wisata Halal" };

export const optionsOf = (map) => Object.entries(map).map(([value, { label }]) => ({ value, label }));

export const slugify = (s = "") => s.toString().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const truncate = (s = "", n = 120) => (s && s.length > n ? s.slice(0, n).trimEnd() + "…" : s);
