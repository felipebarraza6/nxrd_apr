"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { POS_CLIENT_SEARCH_PLACEHOLDER, type PosSearchMatch } from "@/lib/pos-client-search";
import { cn } from "@/lib/utils";

/** Chip que indica qué campo coincidió con la búsqueda. */
export function PosSearchMatchBadge({
  match,
  className,
}: {
  match: PosSearchMatch | null | undefined;
  className?: string;
}) {
  if (!match || !match.label) return null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-md bg-azul/10 px-1.5 py-0.5 font-accent text-[10px] uppercase tracking-[0.12em] text-azul",
        className,
      )}
      title={`${match.label}: ${match.value}`}
    >
      <span className="shrink-0 font-semibold">{match.label}</span>
      <span className="truncate opacity-80">{match.value}</span>
    </span>
  );
}

/** Input de búsqueda unificado para POS de lectura y cargos. */
export function PosClientSearchInput({
  value,
  onChange,
  className,
  inputClassName,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  // El ícono se posiciona contra un wrapper que mide exactamente lo que el
  // input (no contra el contenedor flex, que en columnas puede estirarse).
  return (
    <div className={cn("min-w-[12rem] flex-1", className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          className={cn("h-10 pl-9 text-base md:h-9 md:text-sm", inputClassName)}
          placeholder={POS_CLIENT_SEARCH_PLACEHOLDER}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={POS_CLIENT_SEARCH_PLACEHOLDER}
        />
      </div>
    </div>
  );
}
