import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";

export default function NotFound() {
  useSeo({ title: "Halaman tidak ditemukan", noindex: true });
  return (
    <div className="container-mm flex min-h-[60vh] flex-col items-center justify-center py-20 text-center" data-testid="not-found-page">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"><Compass className="h-10 w-10" /></div>
      <p className="mt-6 font-serif text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground">Tautan mungkin sudah berubah atau halaman telah dipindahkan. Mari kembali ke beranda atau jelajahi paket perjalanan kami.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/" className="btn-primary" data-testid="not-found-home">Ke Beranda</Link><Link to="/packages" className="btn-outline" data-testid="not-found-packages">Lihat Paket</Link></div>
    </div>
  );
}
