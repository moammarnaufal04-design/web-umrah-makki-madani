import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { adminApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [admin, setAdmin] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, next) => setSession(next ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!session) {
      setAdmin(null);
      setAdminError(null);
      return;
    }
    setChecking(true);
    adminApi
      .get("/me")
      .then(({ data }) => !cancelled && setAdmin(data))
      .catch((err) => {
        if (cancelled) return;
        setAdmin(null);
        setAdminError(err?.response?.status === 403 ? "Akun ini tidak memiliki akses Super Admin." : "Gagal memverifikasi sesi admin.");
      })
      .finally(() => !cancelled && setChecking(false));
    return () => { cancelled = true; };
  }, [session?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loginWithPassword = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Email atau password salah");
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/admin` } });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  }, []);

  return <AuthContext.Provider value={{ session, admin, adminError, checking, loginWithPassword, loginWithGoogle, logout, isAuthenticated: !!session && !!admin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function ProtectedRoute({ children }) {
  const { session, admin, adminError, checking, logout } = useAuth();
  const location = useLocation();
  if (session === undefined || (session && checking && !admin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" data-testid="auth-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (!admin && adminError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center" data-testid="auth-forbidden">
        <h1 className="text-2xl font-semibold">Akses Ditolak</h1>
        <p className="max-w-md text-sm text-muted-foreground">{adminError}</p>
        <button onClick={logout} className="btn-primary" data-testid="auth-forbidden-logout">Keluar & Login dengan akun lain</button>
      </div>
    );
  }
  if (!admin) return null;
  return children;
}
