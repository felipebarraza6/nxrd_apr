"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { WaterVariant } from "@/components/auth/water-canvas";

const WaterCanvas = dynamic(() => import("@/components/auth/water-canvas"), {
  ssr: false,
  loading: () => null,
});

/** Backdrop WebGL + CSS fallback. Una instancia por shell. */
export function AuthWaterBackdrop({
  variant = "dark",
  intensity = 1,
}: {
  variant?: WaterVariant;
  intensity?: number;
}) {
  const light = variant === "light";
  return (
    <>
      <div
        className={cn(
          "absolute inset-0",
          light ? "fondo-agua-light" : "fondo-agua",
        )}
        aria-hidden
      />
      <WaterCanvas
        variant={variant}
        intensity={intensity}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {!light ? (
        <>
          <div className="puntos pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-tinta/80 via-tinta/30 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-tinta to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div className="puntos-oscura pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      )}
    </>
  );
}

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
