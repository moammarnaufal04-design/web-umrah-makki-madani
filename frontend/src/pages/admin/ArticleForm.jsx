import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiError } from "@/lib/api";
import { ObjectListEditor, SelectField, SwitchField, TextField, TextareaField } from "@/components/admin/Fields";
import { ImageField } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ARTICLE_STATUS, optionsOf, slugify } from "@/lib/format";

const EMPTY = { title: "", slug: "", excerpt: "", content: "", featured_image_url: "", category_id: "", author_name: "Tim Makki Madani", status: "DRAFT", published_at: "", seo_title: "", seo_description: "", is_featured: false, related_article_ids: [], sources: [], tag_ids: [] };

export default function ArticleForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const { data: article, isLoading } = useQuery({ queryKey: ["admin-article", id], queryFn: async () => (await adminApi.get(`/articles/${id}`)).data, enabled: !isNew });
  const { data: cats = [] } = useQuery({ queryKey: ["admin-article-categories"], queryFn: async () => (await adminApi.get("/article-categories")).data });
  const { data: tags = [] } = useQuery({ queryKey: ["admin-tags"], queryFn: async () => (await adminApi.get("/tags")).data });
  const { data: all } = useQuery({ queryKey: ["admin-articles", "all"], queryFn: async () => (await adminApi.get("/articles", { params: { limit: 200 } })).data });
  useEffect(() => { if (article) setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(article).map(([k, v]) => [k, v === null ? "" : v])), published_at: article.published_at ? article.published_at.slice(0, 16) : "", tag_ids: article.tags?.map((t) => t.id) || [], category_id: article.category_id || "" }); }, [article]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3) { toast.error("Judul minimal 3 karakter"); return; }
    setBusy(true);
    const payload = { ...form, slug: form.slug || null, category_id: form.category_id || null, published_at: form.published_at ? new Date(form.published_at).toISOString() : null, excerpt: form.excerpt || null, featured_image_url: form.featured_image_url || null, seo_title: form.seo_title || null, seo_description: form.seo_description || null, author_name: form.author_name || null, sources: (form.sources || []).filter((s) => s.label || s.url) };
    delete payload.tags; delete payload.category; delete payload.view_count; delete payload.created_at; delete payload.updated_at; delete payload.id;
    try {
      const { data } = isNew ? await adminApi.post("/articles", payload) : await adminApi.put(`/articles/${id}`, payload);
      toast.success(isNew ? "Artikel dibuat" : "Artikel disimpan");
      qc.invalidateQueries({ queryKey: ["admin-articles"] }); qc.invalidateQueries({ queryKey: ["admin-article", id] });
      if (isNew) navigate(`/admin/content/articles/${data.id}`, { replace: true });
    } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  if (!isNew && isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const toggleTag = (tid) => set("tag_ids", form.tag_ids.includes(tid) ? form.tag_ids.filter((x) => x !== tid) : [...form.tag_ids, tid]);
  const toggleRelated = (aid) => set("related_article_ids", form.related_article_ids.includes(aid) ? form.related_article_ids.filter((x) => x !== aid) : [...form.related_article_ids, aid].slice(-3));
  return (
    <form onSubmit={save} data-testid="article-form">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><Link to="/admin/content/articles" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Kembali ke artikel</Link><h1 className="mt-2 font-sans text-2xl font-bold tracking-tight sm:text-3xl">{isNew ? "Artikel Baru" : "Edit Artikel"}</h1>{article?.slug && <Link to={`/articles/${article.slug}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" /> /articles/{article.slug}</Link>}</div>
        <div className="flex flex-wrap items-end gap-2">
          <SelectField label="Status" value={form.status} onChange={(v) => set("status", v)} options={optionsOf(ARTICLE_STATUS)} testId="article-status-select" className="w-40" />
          <button type="submit" disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="article-save-button">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan</button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="admin-surface grid gap-4">
            <TextField label="Judul" value={form.title} onChange={(v) => { set("title", v); if (isNew && !form.slug) set("slug", ""); }} required testId="article-title-input" />
            <TextField label="Slug" value={form.slug} onChange={(v) => set("slug", v)} hint={`Pratinjau: /articles/${form.slug || slugify(form.title) || "..."}`} testId="article-slug-input" />
            <TextareaField label="Ringkasan (excerpt)" value={form.excerpt} onChange={(v) => set("excerpt", v)} rows={3} testId="article-excerpt-input" />
          </div>
          <div className="admin-surface"><label className="field-label">Konten</label><RichTextEditor value={form.content} onChange={(v) => set("content", v)} testId="article-editor" /></div>
          <div className="admin-surface"><ObjectListEditor label="Referensi / Sumber" hint="Perbarui bila ada perubahan regulasi, biaya, atau ketentuan." value={form.sources} onChange={(v) => set("sources", v)} itemLabel="Referensi" fields={[{ key: "label", label: "Label" }, { key: "url", label: "URL" }]} testId="article-sources" /></div>
          <div className="admin-surface grid gap-4 md:grid-cols-2"><TextField label="SEO title" value={form.seo_title} onChange={(v) => set("seo_title", v)} className="md:col-span-2" testId="article-seo-title" /><TextareaField label="Meta description" value={form.seo_description} onChange={(v) => set("seo_description", v)} rows={2} className="md:col-span-2" testId="article-seo-description" /></div>
        </div>
        <div className="space-y-6">
          <div className="admin-surface grid gap-4">
            <SelectField label="Kategori" value={form.category_id} onChange={(v) => set("category_id", v)} options={cats.map((c) => ({ value: c.id, label: c.name }))} allowEmpty testId="article-category-select" />
            <TextField label="Penulis" value={form.author_name} onChange={(v) => set("author_name", v)} testId="article-author-input" />
            <TextField label="Tanggal publikasi" type="datetime-local" value={form.published_at} onChange={(v) => set("published_at", v)} hint="Isi tanggal mendatang + status Terjadwal untuk menjadwalkan" testId="article-published-at" />
            <SwitchField label="Artikel unggulan" value={form.is_featured} onChange={(v) => set("is_featured", v)} testId="article-featured-switch" />
            <ImageField label="Gambar utama" value={form.featured_image_url} onChange={(v) => set("featured_image_url", v)} folder="article" testId="article-image" />
          </div>
          <div className="admin-surface"><label className="field-label">Tag</label><div className="flex flex-wrap gap-2" data-testid="article-tags">{tags.map((t) => <button type="button" key={t.id} onClick={() => toggleTag(t.id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${form.tag_ids.includes(t.id) ? "border-primary bg-primary/10 text-primary" : "hover:border-primary"}`} data-testid={`article-tag-${t.slug}`}>#{t.name}</button>)}{!tags.length && <span className="text-xs text-muted-foreground">Belum ada tag. Tambahkan di menu Tags.</span>}</div></div>
          <div className="admin-surface"><label className="field-label">Artikel terkait (maks. 3)</label><ul className="max-h-64 space-y-1 overflow-y-auto text-sm">{(all?.items || []).filter((a) => a.id !== id).map((a) => <li key={a.id}><button type="button" onClick={() => toggleRelated(a.id)} className={`w-full truncate rounded-md px-2 py-1.5 text-left text-xs ${form.related_article_ids.includes(a.id) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>{a.title}</button></li>)}</ul></div>
        </div>
      </div>
    </form>
  );
}
