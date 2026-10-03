import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { publicApi } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import { useSeo, breadcrumbSchema, faqSchema } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TextSkeleton } from "@/components/public/Skeletons";
import { EmptyState } from "@/components/public/States";

export default function FaqPage() {
  const { waUrl } = useSite();
  const { data: faqs = [], isLoading } = useQuery({ queryKey: ["faqs"], queryFn: async () => (await publicApi.get("/faqs")).data });
  useSeo({ title: "Pertanyaan yang Sering Diajukan", description: "Jawaban atas pertanyaan umum seputar pendaftaran, dokumen, pembayaran, dan perjalanan umrah bersama Makki Madani.", path: "/faq", jsonLd: [breadcrumbSchema([{ label: "FAQ", href: "/faq" }]), ...(faqs.length ? [faqSchema(faqs)] : [])] });
  return (
    <div className="container-mm py-10 sm:py-14" data-testid="faq-page">
      <Breadcrumbs items={[{ label: "FAQ" }]} />
      <div className="mt-6 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4"><div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow">FAQ</span></div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pertanyaan yang Sering Diajukan</h1><p className="mt-3 text-base text-muted-foreground">Tidak menemukan jawaban? Tim kami siap membantu melalui WhatsApp.</p><a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-wa mt-6"><MessageCircle className="h-4 w-4" /> Tanya via WhatsApp</a><Link to="/packages" className="mt-3 block text-sm font-semibold text-primary hover:underline">Lihat paket →</Link></div>
        <div className="lg:col-span-8">{isLoading ? <TextSkeleton lines={8} /> : faqs.length === 0 ? <EmptyState title="Belum ada FAQ" /> : <Accordion type="single" collapsible className="card-mm px-6">{faqs.map((f) => <AccordionItem key={f.id} value={f.id} data-testid={`faq-page-item-${f.id}`}><AccordionTrigger className="py-5 text-left font-sans text-base font-semibold hover:no-underline">{f.question}</AccordionTrigger><AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.answer}</AccordionContent></AccordionItem>)}</Accordion>}</div>
      </div>
    </div>
  );
}
