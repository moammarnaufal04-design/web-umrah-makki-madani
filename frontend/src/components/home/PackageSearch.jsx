import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { publicApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GROUP_LABEL } from "@/lib/format";

const monthLabel = (ym) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(ym + "-01T00:00:00"));

export function PackageSearch({ section, embedded = false }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("ALL");
  const [month, setMonth] = useState("ALL");
  const { data: months = [] } = useQuery({ queryKey: ["package-months"], queryFn: async () => (await publicApi.get("/packages/months")).data });

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (month !== "ALL") params.set("month", month);
    const base = group === "ALL" ? "/packages" : `/packages/${group.toLowerCase()}`;
    navigate(`${base}${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <section className={embedded ? "" : "container-mm -mt-6 sm:-mt-10 relative z-10"} data-testid="package-search-section">
      <form onSubmit={submit} className="card-mm grid gap-3 p-4 shadow-card sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={section?.title || "Cari paket, maskapai, atau kategori…"} data-testid="package-search-input" className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm focus:border-primary focus:outline-none" />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="h-12 rounded-xl" data-testid="package-search-group"><SelectValue placeholder="Jenis program" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Program</SelectItem>
            {Object.entries(GROUP_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-12 rounded-xl" data-testid="package-search-month"><SelectValue placeholder="Bulan keberangkatan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Bulan</SelectItem>
            {months.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <button type="submit" className="btn-primary h-12 rounded-xl px-6" data-testid="package-search-submit">Cari Paket</button>
      </form>
    </section>
  );
}
