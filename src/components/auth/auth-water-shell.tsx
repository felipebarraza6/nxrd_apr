"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WaterBackdrop } from "@/components/water";

/** Nombre de Cauce para el caudal portable. La pieza que se copia es `src/components/water`. */
export const AuthWaterBackdrop = WaterBackdrop;

/**
 * Shell visual Smart APR para páginas públicas de auth/signup.
 */
export function AuthWaterShell({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-tinta text-papel",
        className,
      )}
    >
      <AuthWaterBackdrop variant="dark" intensity={1} />
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Tarjeta opaca/blur detrás del formulario (WCAG AA sobre el agua). */
export function AuthFormCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-papel/15 bg-tinta/85 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthBrandHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/cauce-wordmark-light.svg"
        alt="Cauce"
        className="h-14 w-auto sm:h-16"
      />
      <p className="font-accent text-[10px] font-medium uppercase tracking-[0.28em] text-papel/60">
        un producto de Smart APR SpA
      </p>
      {title ? (
        <h1 className="mt-1 font-heading text-xl font-bold tracking-[-0.02em] text-papel sm:text-2xl">
          {title}
        </h1>
      ) : null}
      {subtitle ? (
        <p className="text-sm leading-relaxed text-papel/70">{subtitle}</p>
      ) : null}
    </div>
  );
}
