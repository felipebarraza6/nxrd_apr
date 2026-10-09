import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

/**
 * Encabezado de módulo. Título grande a la izquierda, como la landing,
 * con el subtítulo en prosa debajo. Sin caja de ícono.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-0 flex flex-col gap-4 border-b border-tinta/10 bg-transparent px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8",
        "max-md:sticky max-md:top-0 max-md:z-20 max-md:bg-papel/88 max-md:backdrop-blur-md",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          {icon ? <span className="text-azul [&_svg]:h-6 [&_svg]:w-6">{icon}</span> : null}
          <h1 className="font-heading text-[clamp(1.75rem,3.2vw,2.75rem)] font-bold leading-[0.92] tracking-[-0.03em] text-tinta">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta/60">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
