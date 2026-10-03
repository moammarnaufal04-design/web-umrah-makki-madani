import { ShieldCheck } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { useSeo, breadcrumbSchema } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

const META = {
  legal: { title: "Informasi Legal", path: "/legal", desc: "Informasi legalitas dan perizinan PT. Makki Madani Indonesia." },
  privacy: { title: "Kebijakan Privasi", path: "/privacy", desc: "Kebijakan privasi penggunaan data jamaah Makki Madani Tour & Travel." },
  terms: { title: "Syarat & Ketentuan", path: "/terms", desc: "Syarat dan ketentuan layanan Makki Madani Tour & Travel." },
};

export default function LegalPage({ type = "legal" }) {
  const { settings, brand } = useSite();
  const legal = settings.legal || {};
  const meta = META[type];
  useSeo({ title: meta.title, description: meta.desc, path: meta.path, jsonLd: breadcrumbSchema([{ label: meta.title, href: meta.path }]) });
  const rows = [["Nama Perusahaan", brand.legal_name], ["Nama Dagang", brand.name], ["Tahun Berdiri", brand.founded_year], ["PPIU", legal.ppiu], ["PIHK", legal.pihk], ["NIB", legal.nib], ["NPWP", legal.npwp], ["Legalitas Perusahaan", legal.company_legal], ["Alamat", settings.contact?.address]];
  return (
    <div className="container-mm max-w-3xl py-10 sm:py-14" data-testid={`${type}-page`}>
      <Breadcrumbs items={[{ label: meta.title }]} />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{meta.title}</h1>
      {type === "legal" ? (
        <>
          <p className="mt-4 text-base text-muted-foreground">{legal.notes}</p>
          <div className="card-mm mt-8 divide-y divide-border/70" data-testid="legal-table">
            {rows.map(([k, v]) => <div key={k} className="grid gap-1 p-4 sm:grid-cols-[200px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt><dd className="text-sm">{v || "-"}</dd></div>)}
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Kami tidak mencantumkan nomor izin, akreditasi, atau klaim legal yang belum terverifikasi. Informasi bertanda [PLACEHOLDER] akan diperbarui setelah dokumen resmi tersedia.</p></div>
        </>
      ) : (
        <div className="prose-mm mt-8" data-testid={`${type}-content`} dangerouslySetInnerHTML={{ __html: (type === "privacy" ? legal.privacy_policy : legal.terms) || "<p>Konten belum tersedia.</p>" }} />
      )}
    </div>
  );
}
