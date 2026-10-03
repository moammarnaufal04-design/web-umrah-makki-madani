import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publicApi, apiError } from "@/lib/api";
import { formatDate } from "@/lib/format";

const EMPTY = { full_name: "", gender: "", address: "", whatsapp: "", email: "", plan_month: "", notes: "", website: "" };

export function RegistrationModal({ pkg, open, onOpenChange }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const validate = () => {
    const e = {};
    if (form.full_name.trim().length < 2) e.full_name = "Nama lengkap wajib diisi";
    if (!form.gender) e.gender = "Pilih jenis kelamin";
    if (form.address.trim().length < 3) e.address = "Alamat wajib diisi";
    const digits = form.whatsapp.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) e.whatsapp = "Nomor WhatsApp tidak valid";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Format email tidak valid";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = { ...form, email: form.email || null, plan_month: form.plan_month || null, notes: form.notes || null, package_id: pkg.id, source_page: window.location.href };
      const { data } = await publicApi.post("/registrations", payload);
      setResult(data);
    } catch (err) {
      setServerError(apiError(err, "Pendaftaran gagal dikirim. Silakan coba lagi."));
    } finally {
      setBusy(false);
    }
  };

  const close = (v) => {
    onOpenChange(v);
    if (!v) setTimeout(() => { setResult(null); setForm(EMPTY); setErrors({}); setServerError(""); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg" data-testid="registration-modal">
        {result ? (
          <div className="py-2 text-center" data-testid="registration-success">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div>
            <DialogHeader className="mt-4">
              <DialogTitle className="text-center font-serif text-2xl">Pendaftaran Diterima</DialogTitle>
              <DialogDescription className="text-center">Terima kasih, <strong>{result.registration.full_name}</strong>. Data Anda untuk paket <strong>{result.registration.package_name}</strong> telah kami simpan.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Kode Pendaftaran</div>
              <div className="mt-1 font-mono text-lg font-bold text-primary" data-testid="registration-code">{result.registration.code}</div>
              <div className="mt-1 text-xs text-muted-foreground">Simpan kode ini untuk memudahkan komunikasi dengan admin.</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Lanjutkan konsultasi melalui WhatsApp agar tim kami dapat membantu kelengkapan dokumen dan pembayaran.</p>
            <div className="mt-5 flex flex-col gap-3">
              {result.whatsapp_url && <a href={result.whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn-wa w-full" data-testid="registration-whatsapp-button"><MessageCircle className="h-4 w-4" /> Konsultasi WhatsApp</a>}
              {result.whatsapp_group_url && <a href={result.whatsapp_group_url} target="_blank" rel="noopener noreferrer" className="btn-outline w-full" data-testid="registration-group-button"><Users className="h-4 w-4" /> Gabung Grup Jamaah</a>}
              <button onClick={() => close(false)} className="text-sm text-muted-foreground hover:text-foreground" data-testid="registration-close-button">Tutup</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate data-testid="registration-form">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Daftar Paket</DialogTitle>
              <DialogDescription>
                <span className="font-semibold text-foreground">{pkg?.name}</span>
                {pkg?.departure_date && <> · Keberangkatan {formatDate(pkg.departure_date)}</>}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-4">
              <div>
                <Label htmlFor="reg-name">Nama Lengkap (sesuai paspor)</Label>
                <Input id="reg-name" value={form.full_name} onChange={set("full_name")} placeholder="Nama lengkap" data-testid="registration-name-input" className="mt-1.5 h-11" />
                {errors.full_name && <p className="mt-1 text-xs text-destructive" data-testid="error-full-name">{errors.full_name}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Jenis Kelamin</Label>
                  <Select value={form.gender} onValueChange={set("gender")}>
                    <SelectTrigger className="mt-1.5 h-11" data-testid="registration-gender-select"><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE" data-testid="gender-option-male">Laki-laki</SelectItem>
                      <SelectItem value="FEMALE" data-testid="gender-option-female">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="mt-1 text-xs text-destructive">{errors.gender}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-wa">Nomor WhatsApp</Label>
                  <Input id="reg-wa" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} placeholder="08xxxxxxxxxx" data-testid="registration-whatsapp-input" className="mt-1.5 h-11" />
                  {errors.whatsapp && <p className="mt-1 text-xs text-destructive">{errors.whatsapp}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="reg-address">Alamat</Label>
                <Textarea id="reg-address" rows={2} value={form.address} onChange={set("address")} placeholder="Alamat domisili" data-testid="registration-address-input" className="mt-1.5" />
                {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="reg-email">Email <span className="text-muted-foreground">(opsional)</span></Label>
                  <Input id="reg-email" type="email" value={form.email} onChange={set("email")} placeholder="nama@email.com" data-testid="registration-email-input" className="mt-1.5 h-11" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-plan">Rencana Berangkat <span className="text-muted-foreground">(opsional)</span></Label>
                  <Input id="reg-plan" value={form.plan_month} onChange={set("plan_month")} placeholder="Misal: Januari 2027" data-testid="registration-plan-input" className="mt-1.5 h-11" />
                </div>
              </div>
              <div>
                <Label htmlFor="reg-notes">Catatan <span className="text-muted-foreground">(opsional)</span></Label>
                <Textarea id="reg-notes" rows={2} value={form.notes} onChange={set("notes")} placeholder="Pertanyaan atau kebutuhan khusus" data-testid="registration-notes-input" className="mt-1.5" />
              </div>
              <input type="text" name="website" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {serverError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" data-testid="registration-server-error">{serverError}</p>}
              <button type="submit" disabled={busy} className="btn-primary mt-1 w-full disabled:opacity-60" data-testid="registration-submit-button">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {busy ? "Mengirim…" : "Kirim Pendaftaran"}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">Dengan mendaftar Anda menyetujui <a href="/terms" className="underline">Syarat & Ketentuan</a> dan <a href="/privacy" className="underline">Kebijakan Privasi</a>. Belum ada pembayaran pada tahap ini.</p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
