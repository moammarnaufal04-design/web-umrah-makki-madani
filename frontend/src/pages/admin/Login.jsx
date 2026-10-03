import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { useSeo } from "@/hooks/useSeo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { session, admin, loginWithPassword, loginWithGoogle, adminError, checking } = useAuth();
  const { brand } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useSeo({ title: "Admin Login", noindex: true, path: "/admin/login" });
  if (session && admin) return <Navigate to={location.state?.from?.pathname || "/admin"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try { await loginWithPassword(email, password); navigate("/admin", { replace: true }); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const google = async () => { setError(""); try { await loginWithGoogle(); } catch (err) { setError(err.message); } };

  return (
    <div className="grid min-h-screen lg:grid-cols-2" data-testid="admin-login-page">
      <div className="grain relative hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tosca-600 font-serif text-xl font-bold">M</span><div><div className="font-serif text-lg font-bold">{brand.name || "Makki Madani Tour & Travel"}</div><div className="text-xs uppercase tracking-[0.2em] text-slate-400">Travel Management System</div></div></div>
        <div><p className="font-serif text-4xl leading-tight">“{brand.tagline || "Teman Perjalanan Menuju Tanah Suci"}”</p><p className="mt-6 max-w-md text-sm text-slate-400">Kelola paket, jamaah, pembayaran, konten, dan SEO dari satu dashboard. Hanya untuk Super Admin yang berwenang.</p></div>
        <div className="text-xs text-slate-500">{brand.legal_name} · Banda Aceh</div>
      </div>
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-serif text-xl font-bold text-primary-foreground">M</span></div>
          <div className="eyebrow">Super Admin</div>
          <h1 className="mt-2 font-sans text-2xl font-bold tracking-tight sm:text-3xl">Masuk ke Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gunakan akun admin yang telah terdaftar.</p>
          <form onSubmit={submit} className="mt-8 space-y-4" data-testid="admin-login-form">
            <div><Label htmlFor="email">Email</Label><div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10" placeholder="admin@email.com" data-testid="login-email-input" /></div></div>
            <div><Label htmlFor="password">Password</Label><div className="relative mt-1.5"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10" placeholder="••••••••" data-testid="login-password-input" /></div></div>
            {(error || adminError) && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" data-testid="login-error">{error || adminError}</p>}
            <button type="submit" disabled={busy || checking} className="btn-primary w-full rounded-xl disabled:opacity-60" data-testid="login-submit-button">{busy || checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}</button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" /></div>
          <button onClick={google} className="btn-outline w-full rounded-xl" data-testid="login-google-button">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
            Masuk dengan Google
          </button>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">Login Google aktif setelah provider Google diaktifkan di Supabase Auth. Hanya email Super Admin terdaftar yang dapat masuk.</p>
        </div>
      </div>
    </div>
  );
}
