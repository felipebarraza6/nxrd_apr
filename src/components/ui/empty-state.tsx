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
        "flex flex-col items-center justify-center gap-3 border border-dashed border-tinta/15 bg-white/60 py-12 text-center backdrop-blur-sm",
        className,
      )}
    >
      {Icon && (
        <span className="mb-1 flex h-12 w-12 items-center justify-center bg-azul/10">
          <Icon className="h-6 w-6 text-azul" strokeWidth={1.75} />
        </span>
      )}
      <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-tinta">
        {title}
      </p>
      {description && (
        <p className="max-w-sm font-accent text-[11px] uppercase leading-relaxed tracking-[0.12em] text-tinta/50">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
