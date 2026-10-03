import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, subtitle, align = "left", className, action }) {
  return (
    <div className={cn("mb-10 flex flex-col gap-4 sm:mb-14 md:flex-row md:items-end md:justify-between", align === "center" && "items-center text-center md:flex-col md:items-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <div className="mb-3 flex items-center gap-3"><span className="gold-line" /><span className="eyebrow">{eyebrow}</span></div>}
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-base text-muted-foreground md:text-lg">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
