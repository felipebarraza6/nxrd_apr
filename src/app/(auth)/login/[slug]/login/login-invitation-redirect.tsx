"use client";

import { useEffect } from "react";
import { loginHrefFromInvitationPath } from "@/lib/auth-links";

/**
 * Correo de nuevo acceso: /login/<slug>/login → /login?branch=<slug>.
 * El token de query se re-codifica para que un `+` del correo no se vuelva espacio.
 */
export function LoginInvitationRedirect() {
  useEffect(() => {
    const target = loginHrefFromInvitationPath(
      window.location.pathname,
      window.location.search,
    );
    window.location.replace(target);
  }, []);

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
