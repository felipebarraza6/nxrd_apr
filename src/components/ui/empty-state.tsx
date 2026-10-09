import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Estado vacío reutilizable: reemplaza los párrafos sueltos improvisados
 * ("Sin datos", "No hay resultados", etc.) por un bloque centrado con
 * ícono, título, descripción y acción opcional.
 */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Botón o enlace de acción sugerida (ej. "Crear producto"). */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 border-t border-tinta/10 px-4 py-10 sm:px-8",
        className,
      )}
    >
      {Icon ? <Icon className="h-5 w-5 text-azul" strokeWidth={1.75} /> : null}
      <p className="font-heading text-2xl font-bold tracking-[-0.03em] text-tinta">{title}</p>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-tinta/60">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
