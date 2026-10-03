import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CalendarClock, Loader2, Package, PackageCheck, Users, Wallet, Armchair, UserPlus } from "lucide-react";
import { adminApi } from "@/lib/api";
import { StatCard } from "@/components/admin/Common";
import { StatusBadge } from "@/components/public/StatusBadge";
import { PAY_STATUS, REG_STATUS, formatDate, formatDateTime, formatRupiah } from "@/lib/format";

const COLORS = ["#0F766E", "#D97706", "#0F172A", "#14B8A6", "#F59E0B", "#94A3B8"];

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: async () => (await adminApi.get("/dashboard")).data, refetchInterval: 60_000 });
  if (isLoading || !data) return <div className="flex h-96 items-center justify-center" data-testid="dashboard-loading"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const c = data.cards;
  const quotaPct = c.quota_total ? Math.round((c.quota_filled / c.quota_total) * 100) : 0;
  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">Ringkasan Operasional</h1><p className="text-sm text-muted-foreground">Pantau paket, pendaftaran, pembayaran, dan kuota dalam satu layar.</p></div>
        <Link to="/admin/products/packages/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="dashboard-new-package">+ Paket Baru</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Total Paket" value={c.total_packages} hint={`${c.active_packages} aktif & publik`} testId="stat-total-packages" />
        <StatCard icon={PackageCheck} label="Paket Aktif" value={c.active_packages} tone="emerald" testId="stat-active-packages" />
        <StatCard icon={Users} label="Total Jamaah" value={c.total_customers} hint={`${c.total_registrations} pendaftaran`} tone="navy" testId="stat-total-customers" />
        <StatCard icon={UserPlus} label="Pendaftaran Baru" value={c.new_registrations} hint="status NEW" tone="gold" testId="stat-new-registrations" />
        <StatCard icon={Wallet} label="Pembayaran Diterima" value={formatRupiah(c.payments_total)} hint={`${c.payments_count} transaksi · sisa ${formatRupiah(c.outstanding)}`} testId="stat-payments" />
        <StatCard icon={Armchair} label="Quota Terisi" value={c.quota_filled} hint={`${quotaPct}% dari ${c.quota_total}`} tone="gold" testId="stat-quota-filled" />
        <StatCard icon={Armchair} label="Quota Tersisa" value={c.quota_remaining} tone="emerald" testId="stat-quota-remaining" />
        <StatCard icon={BookOpen} label="Pesan Masuk Baru" value={c.new_messages} tone="rose" testId="stat-new-messages" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="admin-surface xl:col-span-2" data-testid="chart-registrations">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-sans text-base font-bold">Pendaftaran 30 Hari Terakhir</h2><span className="text-xs text-muted-foreground">{data.registrations_over_time.reduce((a, b) => a + b.count, 0)} total</span></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.registrations_over_time} margin={{ left: -20, right: 8 }}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0F766E" stopOpacity={0.35} /><stop offset="100%" stopColor="#0F766E" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(8)} tick={{ fontSize: 11 }} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(d) => formatDate(d)} formatter={(v) => [v, "Pendaftaran"]} />
                <Area type="monotone" dataKey="count" stroke="#0F766E" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-surface" data-testid="chart-payment-status">
          <h2 className="mb-4 font-sans text-base font-bold">Status Pembayaran</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={data.payment_status} dataKey="count" nameKey="status" innerRadius={50} outerRadius={75} paddingAngle={3}>{data.payment_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v, n) => [v, PAY_STATUS[n]?.label || n]} /></PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs">{data.payment_status.map((s, i) => <li key={s.status} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{PAY_STATUS[s.status]?.label || s.status}</span><span className="font-semibold">{s.count}</span></li>)}{!data.payment_status.length && <li className="text-muted-foreground">Belum ada data</li>}</ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="admin-surface" data-testid="chart-popularity">
          <h2 className="mb-4 font-sans text-base font-bold">Paket Terpopuler</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.package_popularity} layout="vertical" margin={{ left: 0, right: 16 }}><XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} tickFormatter={(n) => (n.length > 22 ? n.slice(0, 22) + "…" : n)} /><Tooltip formatter={(v) => [v, "Pendaftar"]} /><Bar dataKey="count" fill="#0F766E" radius={[0, 6, 6, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-surface" data-testid="chart-quota">
          <h2 className="mb-4 font-sans text-base font-bold">Utilisasi Kuota</h2>
          <ul className="space-y-3">{data.quota_utilization.map((q) => { const p = q.total ? Math.round((q.filled / q.total) * 100) : 0; return <li key={q.name}><div className="flex justify-between text-xs"><span className="truncate pr-2 font-medium">{q.name}</span><span className="shrink-0 text-muted-foreground">{q.filled}/{q.total}</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className={`h-full rounded-full ${p >= 90 ? "bg-rose-500" : p >= 70 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${p}%` }} /></div></li>; })}{!data.quota_utilization.length && <li className="text-sm text-muted-foreground">Belum ada paket aktif</li>}</ul>
        </div>
        <div className="admin-surface" data-testid="chart-payments-monthly">
          <h2 className="mb-4 font-sans text-base font-bold">Pembayaran per Bulan</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.payments_monthly} margin={{ left: -10, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1e6)}jt`} /><Tooltip formatter={(v) => [formatRupiah(v), "Total"]} /><Bar dataKey="total" fill="#D97706" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="admin-surface xl:col-span-2" data-testid="recent-registrations">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-sans text-base font-bold">Pendaftaran Terbaru</h2><Link to="/admin/customers/registrations" className="text-xs font-semibold text-primary hover:underline">Lihat semua</Link></div>
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="pb-2 pr-4">Jamaah</th><th className="pb-2 pr-4">Paket</th><th className="pb-2 pr-4">Status</th><th className="pb-2 pr-4">Pembayaran</th><th className="pb-2">Waktu</th></tr></thead>
              <tbody className="divide-y">{data.recent_registrations.map((r) => <tr key={r.id}><td className="py-2.5 pr-4"><div className="font-medium">{r.full_name}</div><div className="text-xs text-muted-foreground">{r.whatsapp}</div></td><td className="max-w-[200px] truncate py-2.5 pr-4 text-xs">{r.package_name}</td><td className="py-2.5 pr-4"><StatusBadge status={r.status} map={REG_STATUS} /></td><td className="py-2.5 pr-4"><StatusBadge status={r.payment_status} map={PAY_STATUS} /></td><td className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">{formatDateTime(r.registered_at)}</td></tr>)}{!data.recent_registrations.length && <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Belum ada pendaftaran</td></tr>}</tbody></table>
          </div>
        </div>
        <div className="admin-surface" data-testid="upcoming-departures">
          <div className="mb-4 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /><h2 className="font-sans text-base font-bold">Keberangkatan Terdekat</h2></div>
          <ul className="divide-y">{data.upcoming_departures.map((u) => <li key={u.id} className="py-3"><Link to={`/admin/products/packages/${u.id}`} className="text-sm font-medium hover:text-primary">{u.name}</Link><div className="mt-0.5 flex justify-between text-xs text-muted-foreground"><span>{formatDate(u.departure_date)}</span><span>Sisa {u.remaining}/{u.total_seats}</span></div></li>)}{!data.upcoming_departures.length && <li className="py-6 text-sm text-muted-foreground">Tidak ada jadwal mendatang</li>}</ul>
        </div>
      </div>
    </div>
  );
}
