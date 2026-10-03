import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Heading2, Heading3, Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Quote, Redo, Undo } from "lucide-react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { cn } from "@/lib/utils";

const Btn = ({ active, onClick, children, label }) => (
  <button type="button" onClick={onClick} title={label} aria-label={label} className={cn("rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground", active && "bg-primary/10 text-primary")}>{children}</button>
);

export function RichTextEditor({ value, onChange, placeholder = "Tulis konten artikel di sini…", testId = "rich-text-editor" }) {
  const [pick, setPick] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false, autolink: true }), Image, Placeholder.configure({ placeholder })],
    content: value || "",
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(value || "", false);
  }, [value, editor]);
  if (!editor) return null;
  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL tautan", prev || "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  return (
    <div data-testid={testId}>
      <div className="flex flex-wrap gap-0.5 rounded-t-lg border border-input bg-muted/40 p-1.5">
        <Btn label="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
        <Btn label="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
        <Btn label="Judul 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
        <Btn label="Judul 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
        <Btn label="Daftar" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
        <Btn label="Daftar bernomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
        <Btn label="Kutipan" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
        <Btn label="Tautan" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="h-4 w-4" /></Btn>
        <Btn label="Gambar" onClick={() => setPick(true)}><ImageIcon className="h-4 w-4" /></Btn>
        <span className="mx-1 w-px bg-border" />
        <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Btn>
        <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Btn>
      </div>
      <EditorContent editor={editor} />
      <MediaPicker open={pick} onOpenChange={setPick} folder="article" onSelect={(m) => editor.chain().focus().setImage({ src: m.url, alt: m.alt_text || "" }).run()} />
    </div>
  );
}
