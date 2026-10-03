import { MessageCircle } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export function FloatingWhatsApp() {
  const { waUrl, whatsappNumber } = useSite();
  if (!whatsappNumber) return null;
  return (
    <a
      href={waUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Konsultasi via WhatsApp"
      data-testid="floating-whatsapp-button"
      className="wa-ring fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40 transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
