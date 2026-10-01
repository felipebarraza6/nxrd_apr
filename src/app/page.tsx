import type { Metadata } from "next";
import { StandaloneRedirect } from "@/components/standalone-redirect";
import { CauceLanding } from "@/components/landing/cauce-landing";

export const metadata: Metadata = {
  title: "Cauce by Smart APR — Gestión de APR: socios, medidores y cobros",
  description:
    "Sistema para Agua Potable Rural: socios, medidores, lecturas, tarifarios, cobros con boleta electrónica SII. 1er mes gratis.",
};

export default function HomePage() {
  return (
    <>
      <StandaloneRedirect />
      <CauceLanding />
    </>
  );
}
