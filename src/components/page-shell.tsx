import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shell de página. Ocupa el ancho de la columna de trabajo, alineado a la
 * izquierda, para que la app no se lea como una card centrada.
 */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("cauce-page flex min-h-full w-full min-w-0 flex-col", className)}>
      {children}
    </div>
  );
}

/**
 * Cuerpo bajo el PageHeader. El aire va en el padding, no en una card.
 */
export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8", className)}>
      {children}
    </div>
  );
}
