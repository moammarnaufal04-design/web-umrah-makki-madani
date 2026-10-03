import { useEffect } from "react";
import { useSite } from "@/context/SiteContext";

function setMeta(attr, key, content) {
  if (content === undefined || content === null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo({ title, description, path, image, type = "website", jsonLd, noindex = false } = {}) {
  const { settings } = useSite();
  const seo = settings?.seo || {};
  const brand = settings?.brand || {};
  useEffect(() => {
    const siteUrl = (seo.site_url || window.location.origin).replace(/\/$/, "");
    const fullTitle = title ? `${title}${seo.title_suffix || ` | ${brand.name || "Makki Madani"}`}` : seo.default_title || brand.name || "Makki Madani Tour & Travel";
    const desc = description || seo.default_description || brand.tagline || "";
    const url = `${siteUrl}${path ?? window.location.pathname}`;
    const img = image || seo.og_image_url || "";
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", url);
    setMeta("property", "og:site_name", brand.name || "Makki Madani Tour & Travel");
    setMeta("property", "og:locale", "id_ID");
    if (img) setMeta("property", "og:image", img);
    setMeta("name", "twitter:card", img ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    if (img) setMeta("name", "twitter:image", img);
    if (seo.twitter_handle) setMeta("name", "twitter:site", seo.twitter_handle);
    if (seo.google_site_verification) setMeta("name", "google-site-verification", seo.google_site_verification);
    setLink("canonical", url);
    const id = "seo-jsonld";
    let script = document.getElementById(id);
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = id;
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, image, type, noindex, JSON.stringify(jsonLd), JSON.stringify(seo), brand.name, brand.tagline]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function organizationSchema(settings) {
  const brand = settings?.brand || {};
  const contact = settings?.contact || {};
  const social = settings?.social || {};
  const seo = settings?.seo || {};
  return {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "Organization"],
    name: brand.name,
    legalName: brand.legal_name,
    slogan: brand.tagline,
    url: seo.site_url || window.location.origin,
    logo: brand.logo_url || undefined,
    telephone: contact.phone ? `+${normalize(contact.phone)}` : undefined,
    email: contact.email || undefined,
    foundingDate: brand.founded_year ? String(brand.founded_year) : undefined,
    address: { "@type": "PostalAddress", streetAddress: "Jl. Teuku Nyak Arief No. 13, Lamgugob", addressLocality: "Banda Aceh", addressRegion: "Aceh", postalCode: "24415", addressCountry: "ID" },
    areaServed: (contact.service_areas || []).map((a) => ({ "@type": "Place", name: a })),
    sameAs: [social.instagram, social.tiktok, social.youtube, social.facebook].filter(Boolean),
  };
}

function normalize(n = "") {
  let d = String(n).replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return d;
}

export function breadcrumbSchema(items) {
  const base = window.location.origin;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, item: it.href ? `${base}${it.href}` : undefined })),
  };
}

export function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}
