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
 * Encabezado estándar (referencia: Dashboard).
 * - Borde inferior + padding `px-4 py-3 sm:px-6`
 * - Título display + subtítulo muted
 * - Icono con tokens de marca (`bg-primary/10 text-primary`)
 * Sin margen inferior: el cuerpo (`PageBody`) aporta el gap.
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
        "mb-0 flex flex-col gap-3 border-b border-tinta/10 bg-white/70 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6",
        // Sticky glass en móvil: se siente app al scrollear listados.
        "max-md:sticky max-md:top-0 max-md:z-20 max-md:bg-papel/90 max-md:backdrop-blur-md max-md:supports-[backdrop-filter]:bg-papel/80",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-azul/10 text-azul">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-lg font-semibold tracking-[-0.02em] text-tinta">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle ? (
            <p className="mt-0.5 font-accent text-[11px] uppercase tracking-[0.14em] text-tinta/50">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
