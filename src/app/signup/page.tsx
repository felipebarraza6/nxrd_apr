"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CauceSignupSection,
  useCaucePlans,
} from "@/components/landing/cauce-signup";
import { getToken } from "@/lib/api/session-storage";
import { getHomeRouteForUser } from "@/lib/home-route";
import { useSessionStore } from "@/lib/store/session";

/**
 * Fallback de registro: misma sección que la landing (`/#registro`),
 * a pantalla completa. Acepta `?plan=<plan_id>`.
 */
export default function SignupPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);
  const { landing, plans, planId, setPlanId } = useCaucePlans();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!getToken()) return;
    router.replace(getHomeRouteForUser(user));
  }, [hasHydrated, user, router]);

  return (
    <main className="bg-tinta text-papel">
      <CauceSignupSection
        standalone
        sectionLabel="Registro"
        plans={plans}
        landing={landing}
        planId={planId}
        onPlanChange={setPlanId}
      />
    </main>
  );
}
