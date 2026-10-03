import { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { waLink } from "@/lib/format";

const SiteContext = createContext({ settings: {}, sections: [], categories: [], loading: true });

function hexToHsl(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function SiteProvider({ children }) {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["site"], queryFn: async () => (await publicApi.get("/site")).data, staleTime: 60_000 });
  const settings = useMemo(() => data?.settings || {}, [data]);

  useEffect(() => {
    const theme = settings.theme || {};
    const root = document.documentElement;
    if (theme.primary) {
      root.style.setProperty("--brand-primary", theme.primary);
      const hsl = hexToHsl(theme.primary);
      if (hsl) root.style.setProperty("--primary", hsl);
    }
    if (theme.primary_dark) root.style.setProperty("--brand-primary-dark", theme.primary_dark);
    if (theme.accent) {
      root.style.setProperty("--brand-accent", theme.accent);
      const hsl = hexToHsl(theme.accent);
      if (hsl) root.style.setProperty("--accent", hsl);
    }
  }, [settings.theme]);

  const value = useMemo(() => {
    const wa = settings.whatsapp || {};
    const number = wa.number || settings.contact?.whatsapp || "";
    return {
      settings,
      sections: data?.sections || [],
      categories: data?.categories || [],
      loading: isLoading,
      refetch,
      brand: settings.brand || {},
      contact: settings.contact || {},
      social: settings.social || {},
      whatsappNumber: number,
      waUrl: (message) => (number ? waLink(number, message || wa.default_message || "") : "#"),
      categoriesByGroup: (group) => (data?.categories || []).filter((c) => c.group_type === group),
    };
  }, [data, settings, isLoading, refetch]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
