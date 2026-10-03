import { SimpleCrudPage } from "@/components/admin/SimpleCrudPage";

export function ArticleCategories() {
  return (
    <SimpleCrudPage
      title="Kategori Artikel"
      description="Kelompokkan artikel agar mudah ditemukan pembaca dan mesin pencari."
      endpoint="/article-categories"
      queryKey="article-categories-admin"
      itemName="Kategori"
      invalidate={["article-categories"]}
      defaults={{ name: "", slug: "", description: "", is_active: true, sort_order: 0 }}
      columns={(c) => (
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${!c.is_active && "text-muted-foreground line-through"}`}>{c.name} <span className="font-normal text-muted-foreground">· {c.article_count} artikel</span></div>
          <div className="text-xs text-muted-foreground">/{c.slug}{c.description ? ` · ${c.description}` : ""}</div>
        </div>
      )}
      fields={[
        { key: "name", label: "Nama kategori" },
        { key: "slug", label: "Slug (opsional)", hint: "Kosongkan untuk otomatis" },
        { key: "description", label: "Deskripsi", type: "textarea", full: true },
        { key: "sort_order", label: "Urutan", type: "number" },
        { key: "is_active", label: "Aktif", type: "toggle" },
      ]}
    />
  );
}

export function Tags() {
  return (
    <SimpleCrudPage
      title="Tag Artikel"
      description="Kata kunci untuk menghubungkan artikel yang berkaitan."
      endpoint="/tags"
      queryKey="tags-admin"
      itemName="Tag"
      invalidate={["tags"]}
      defaults={{ name: "", slug: "" }}
      columns={(t) => <div className="text-sm"><span className="font-semibold">#{t.name}</span> <span className="text-xs text-muted-foreground">/{t.slug}</span></div>}
      fields={[{ key: "name", label: "Nama tag" }, { key: "slug", label: "Slug (opsional)", hint: "Kosongkan untuk otomatis" }]}
    />
  );
}
