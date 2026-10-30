"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/lib/store/session";
import { loginComplete, forgotPassword, setInitialPassword } from "@/lib/api/auth";
import { fetchMagicLogin } from "@/lib/api/checkout";
import { fetchFrontendConfig } from "@/lib/api/frontend-config";
import {
  fetchBranchTheme,
  fetchPublicLoginTheme,
  fetchPublicLoginThemeByHost,
  applyThemeConfig,
} from "@/lib/api/branches";
import type { BranchThemeConfig } from "@/lib/types";
import { setToken, getToken } from "@/lib/api/session-storage";
import { pickDefaultBranchId } from "@/lib/branch-session";
import { cn } from "@/lib/utils";
import { FRIG_REPO_URL, setTenantFavicon } from "@/lib/frig-identity";
import { getHomeRouteForUser } from "@/lib/home-route";
import { STORAGE, migrateFrigStorageKeys } from "@/lib/storage-keys";
import { BrandLogo } from "@/components/brand-logo";
import {
  AuthFormCard,
  AuthWaterBackdrop,
} from "@/components/auth/auth-water-shell";
import type { LoginCompleteResponse } from "@/lib/types";
import { normalizePathname } from "@/lib/pathname";

if (typeof window !== "undefined") {
  migrateFrigStorageKeys();
}

/* Transición de entrada: el logo de la sucursal (o Frig) antes de navegar.
   Sin texto "Entrando…": una línea de energía da el feedback de carga. */
function DimensionExit({
  brandName,
  brandLogo,
}: {
  brandName: string | null;
  brandLogo: string | null;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#061624]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 115%, rgba(56,189,248,0.5) 0%, rgba(56,189,248,0.14) 45%, transparent 70%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-8">
        {brandLogo ? (
          <BrandLogo
            src={brandLogo}
            alt={brandName ?? "Logo"}
            name={brandName}
            containerClassName="h-24 w-24 rounded-2xl"
            className="h-24 w-24 rounded-2xl object-contain"
          />
        ) : (
          <>
            {!brandName && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/cauce-symbol.svg"
                  alt=""
                  className="h-16 w-auto"
                  style={{ filter: "drop-shadow(0 0 16px rgba(56,189,248,0.5))" }}
                />
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/cauce-wordmark-light.svg"
              alt="Cauce"
              className="relative h-16 w-auto sm:h-24"
            />
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-700">
              un producto de Smart APR SpA
            </div>
          </>
        )}
        {/* Línea de energía: feedback de carga sin texto */}
        <div className="h-0.5 w-40 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full w-1/3 rounded-full bg-[#0369a1]"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const setOwnedOrganizations = useSessionStore((s) => s.setOwnedOrganizations);
  const setFrontendConfig = useSessionStore((s) => s.setFrontendConfig);
  const setTheme = useSessionStore((s) => s.setTheme);
  const user = useSessionStore((s) => s.user);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);

  const [mode, setMode] = useState<"login" | "forgot" | "set_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    migrateFrigStorageKeys();
    // Aviso persistido por client.ts cuando una sesión expira (p. ej. demo).
    const notice = window.sessionStorage.getItem(STORAGE.authNotice);
    if (notice) window.sessionStorage.removeItem(STORAGE.authNotice);
    return notice;
  });
  const [loading, setLoading] = useState(false);
  // Animación de éxito (estrella pixel + monedas) antes de navegar.
  const [success, setSuccess] = useState(false);
  // Remonta el mensaje de error para re-disparar el shake en cada intento.
  const [errorKey, setErrorKey] = useState(0);

  // Canje del magic-link de contratación: /login/<slug>?token=… llega aquí
  // como ?branch=<slug>&token=<token>. Si el canje falla (expirado/inválido)
  // se muestra el error y queda disponible el login normal con clave.
  const [magicToken] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("token"),
  );

  // Sesión ya activa: no mostrar el formulario (salvo flujo magic/set_password).
  useEffect(() => {
    if (!hasHydrated) return;
    if (magicToken || mode === "set_password") return;
    if (!getToken()) return;
    router.replace(getHomeRouteForUser(user));
  }, [hasHydrated, user, router, magicToken, mode]);

  function celebrateThen(callback: () => void, safetyPath = "/dashboard") {
    setSuccess(true);
    // Navegar pronto (el overlay sigue hasta el desmonte). La red de
    // seguridad es tardía a propósito: un 4s en conexiones lentas forzaba
    // una recarga dura a mitad de carga (doble render y parpadeo).
    window.setTimeout(callback, 700);
    window.setTimeout(() => {
      if (normalizePathname(window.location.pathname) === "/login") {
        window.location.href = window.location.origin + safetyPath;
      }
    }, 8000);
  }

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // El fondo participa en cada cambio de modo: los nodos hacen una ola
  // que cubre la pantalla y decae revelando el nuevo formulario.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("frig:matrix-sweep"));
  }, [mode, forgotSent]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [magicLoginResult, setMagicLoginResult] = useState<LoginCompleteResponse | null>(null);

  // Login personalizado por sucursal: branding público según el dominio
  // (by-host) o según ?branch=<slug>. Sin branding (p. ej. localhost) se
  // mantiene la marca FRIG por defecto.
  const [brandTheme, setBrandTheme] = useState<BranchThemeConfig | null>(null);
  // Demo activa según ?branch=<slug>: muestra credenciales de acceso y aviso de 1 hora.
  // Se calcula una sola vez (lazy init) — no necesita effect.



  useEffect(() => {
    let cancelled = false;
    (async () => {
      const slug = new URLSearchParams(window.location.search).get("branch");
      let theme = slug
        ? await fetchPublicLoginTheme(slug)
        : await fetchPublicLoginThemeByHost();
      // El branding del PROPIO Frig (frig.yggdra.cl, slug "frig") se trata
      // como identidad Frig: logo de cuadritos + cobre, nunca como tenant.
      // Lo mismo con la org propia de Cauce/Smart APR (cauce.smartapr.cl):
      // su tema por host es blanco y sin logo, y tapaba el agua (#14).
      const ownName = (theme?.app_name ?? "").toLowerCase();
      const isFrigBranding =
        !!theme &&
        (ownName.includes("frig") ||
          ownName.includes("cauce") ||
          ownName.includes("smartapr") ||
          ownName.includes("smart apr"));
      if (isFrigBranding) theme = null;
      if (cancelled) return;
      if (theme) {
        setBrandTheme(theme);
        applyThemeConfig(theme);
        // Favicon del tenant; sin favicon propio usa su logo del header.
        setTenantFavicon(theme.favicon, theme.logo);
      }
      // Título del documento con la marca resuelta (tenant o Frig).
      const name = isFrigBranding ? "Cauce" : theme?.app_name ?? "Cauce";
      document.title = `${name} — Iniciar sesión`;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Traduce mensajes DRF crudos (posible inglés) a es-CL para usuarios no técnicos.
  function mapLoginError(message: string): string {
    const m = message.trim();
    if (
      /unable to log in with provided credentials|invalid credentials|credenciales inv?[áa]lidas/i.test(
        m,
      )
    ) {
      return "Correo o contraseña incorrectos. Revisa e inténtalo de nuevo.";
    }
    if (/user account is disabled|cuenta deshabilitada/i.test(m)) {
      return "Tu cuenta está desactivada. Escríbenos a contacto@smartapr.cl.";
    }
    if (/invalid token|token inv?[áa]lido|expired|expirad/i.test(m)) {
      return "Tu enlace o sesión expiró. Vuelve a iniciar sesión.";
    }
    if (/too many attempts|demasiados intentos/i.test(m)) {
      return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
    }
    return m || "Error al iniciar sesión";
  }

  // Pulso de energía al intentar ingresar: la fogata responde.
  const [pulse, setPulse] = useState(false);
  function firePulse() {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 750);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    firePulse();
    try {
      const res = await loginComplete({ email, password });
      await completeLogin(res);
    } catch (err) {
      setError(mapLoginError(err instanceof Error ? err.message : ""));
      setErrorKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Flujo común tras obtener un payload de sesión (login con clave o canje
   * del magic-link de contratación): persistir token, cargar config/tema de
   * la sucursal y navegar al home que corresponda al rol.
   */
  const completeLogin = useCallback(
    async (res: LoginCompleteResponse) => {
      setToken(res.token);
      // Organizaciones que el usuario posee: alimentan el guard de /organization.
      setOwnedOrganizations(res.owned_organizations ?? null);
      // Sesión demo: guardar expiración (1h) para avisos/cuenta regresiva.
      if (res.demo_expires_at) {
        window.localStorage.setItem(STORAGE.demoExpiresAt, res.demo_expires_at);
      } else {
        window.localStorage.removeItem(STORAGE.demoExpiresAt);
      }
      // Activa la sucursal por defecto (o la única) y entra directo: el cambio
      // de sucursal dentro de la app lo hace el switcher del sidebar.
      const target = pickDefaultBranchId(res.user, res.branches);
      if (target) {
        try {
          const config = await fetchFrontendConfig(Number(target));
          setFrontendConfig(config, target);
          // Super admin: black puro, sin tema de ninguna sucursal/org.
          if (!(res.user.is_superuser || res.user.type_user === "ADM")) {
            try {
              const branchTheme = await fetchBranchTheme(target);
              if (branchTheme) {
                setTheme(branchTheme);
                applyThemeConfig(branchTheme);
              }
            } catch {
              // tema no crítico
            }
          }
          const home = getHomeRouteForUser(config.user, config.dashboard);
          celebrateThen(() => router.replace(home), home);
          return;
        } catch {
          // Falló frontend-config: el layout reactivará la sucursal por defecto.
        }
      }
      setSession(res.user, res.branches, res.permissions ?? null);
      const home = getHomeRouteForUser(res.user);
      celebrateThen(() => router.replace(home), home);
    },
    [router, setFrontendConfig, setSession, setOwnedOrganizations, setTheme],
  );

  // Canje del magic-link: el token ya se lee arriba en `magicToken`.
  useEffect(() => {
    if (!magicToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchMagicLogin(magicToken);
        if (cancelled) return;
        if (res.must_set_password) {
          // El set-password requiere Authorization; sin token el client
          // limpia storage y manda a /login (quema el magic link).
          setToken(res.token);
          setMagicLoginResult(res);
          setMode("set_password");
        } else {
          await completeLogin(res);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Enlace inválido o expirado.",
        );
        setErrorKey((k) => k + 1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [magicToken, completeLogin]);

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);
    try {
      // Respuesta genérica del backend (anti-enumeración): el mensaje es el
      // mismo exista o no el email.
      await forgotPassword({ email: forgotEmail });
      setForgotSent(true);
    } catch (err) {
      setForgotError(
        err instanceof Error ? err.message : "No se pudo enviar la solicitud.",
      );
    } finally {
      setForgotLoading(false);
    }
  }

  function backToLogin() {
    setMode("login");
    setForgotSent(false);
    setForgotError(null);
    setForgotEmail("");
    setError(null);
  }

  async function handleSetPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setSetPasswordError(null);
    if (newPassword.length < 8) {
      setSetPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSetPasswordError("Las contraseñas no coinciden.");
      return;
    }
    setSetPasswordLoading(true);
    try {
      await setInitialPassword({ new_password: newPassword, confirm_password: confirmPassword });
      if (magicLoginResult) {
        await completeLogin(magicLoginResult);
      }
    } catch (err) {
      setSetPasswordError(
        err instanceof Error ? err.message : "No se pudo definir la contraseña.",
      );
    } finally {
      setSetPasswordLoading(false);
    }
  }

  // Identidad Cauce/Smart APR sin tenant: fondo agua WebGL.
  // Con branding de sucursal la paleta la deriva applyThemeConfig.
  const isFrigIdentity = !brandTheme;
  const darkSection = isFrigIdentity || brandTheme?.algorithm === "dark";

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-1 flex-col overflow-hidden",
        isFrigIdentity ? "bg-tinta text-papel" : "bg-background text-foreground",
      )}
    >
      {isFrigIdentity ? (
        <AuthWaterBackdrop />
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-background" />
      )}
      <section
        className={cn(
          "relative z-10 flex min-h-dvh flex-1 flex-col items-center justify-center px-4 py-10",
          darkSection ? "dark text-white" : "text-foreground",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative flex w-full max-w-sm flex-col overflow-hidden px-1 font-sans lg:min-h-[600px] lg:justify-center"
        >
          <AuthFormCard
            className={cn(
              !isFrigIdentity && "border-border bg-card/90 text-card-foreground",
            )}
          >
          {/* Fade marcado entre modos: el contenido se desvanece con blur
              mientras la ola de nodos cubre el fondo y trae el siguiente. */}
          <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${forgotSent}`}
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)", transition: { duration: 0.25, ease: "easeIn" } }}
            // El contenido ESPERA a que la ola de nodos cubra todo (0.45s)
            // y recién emerge: primero el fondo, después el formulario.
            transition={{ duration: 0.65, delay: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex w-full flex-col"
          >
          {/* El wordmark de la marca presidiendo el formulario */}
          {/* Marca que preside el formulario: la del tenant si hay branding
              por host/slug; si no, el wordmark animado de Frig. */}
          {brandTheme ? (
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <BrandLogo
                src={brandTheme.logo}
                alt={brandTheme.app_name ?? "Logo"}
                name={brandTheme.app_name}
                containerClassName="h-14 w-14 rounded-xl"
                className="h-14 w-14 rounded-xl object-contain"
              />
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  {brandTheme.login_welcome_message ?? brandTheme.app_name ?? "Bienvenido"}
                </h1>
                {brandTheme.tagline && (
                  <p className="mt-1 text-sm text-muted-foreground">{brandTheme.tagline}</p>
                )}
              </div>
            </div>
          ) : !brandTheme ? (
            /* Identidad Cauce by Smart APR presidiendo el formulario */
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/cauce-wordmark-light.svg"
                alt="Cauce"
                className="h-20 w-auto sm:h-24"
              />
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-300/90">
                un producto de Smart APR SpA
              </div>
            </div>
          ) : null}
          {mode === "set_password" ? (
            <form onSubmit={handleSetPasswordSubmit} className="flex flex-col gap-4">
              <div className="rounded-lg bg-primary/10 px-3 py-3 text-sm text-primary">
                <p className="font-medium">Define tu contraseña</p>
                <p className="mt-1 opacity-90">
                  Es tu primer ingreso. Crea una contraseña para acceder a tu cuenta.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="new_password" className="text-sm font-medium">
                  Nueva contraseña
                </label>
                <Input
                  id="new_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="confirm_password" className="text-sm font-medium">
                  Confirmar contraseña
                </label>
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {setPasswordError && (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                  {setPasswordError}
                </p>
              )}
              <Button type="submit" size="lg" disabled={setPasswordLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-lg text-white">
                {setPasswordLoading ? "Guardando…" : "Definir contraseña"}
              </Button>
            </form>
          ) : mode === "forgot" ? (
            forgotSent ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-sm text-zinc-200">
                  <p className="font-medium">Revisa tu correo</p>
                  <p className="mt-1 opacity-90">
                    Si el email existe en nuestro sistema, recibirás un enlace
                    para recuperar tu contraseña (válido por 24 horas).
                  </p>
                </div>
                <Button type="button" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-lg text-white" onClick={backToLogin}>
                  Volver al inicio de sesión
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="forgot-email" className="text-sm font-medium">
                    Correo
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu@negocio.cl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingresa el correo con el que ingresas a Cauce.
                  </p>
                </div>

                {forgotError && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                    {forgotError}
                  </p>
                )}

                <Button type="submit" size="lg" disabled={forgotLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-lg text-white">
                  {forgotLoading ? "Enviando…" : "Enviar correo de recuperación"}
                </Button>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="cursor-pointer text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@negocio.cl"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p
                  key={errorKey}
                  className="login-shake rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                onClick={firePulse}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-lg text-white active:scale-[0.97] transition-transform"
              >
                {loading ? "Ingresando…" : "Ingresar"}
              </Button>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                  }}
                  className="cursor-pointer text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  ¿Olvidaste tu contraseña? Recupérala aquí
                </button>
              </div>
              <p className="mt-4 text-center text-xs text-papel/55">
                ¿Nueva APR?{" "}
                <a
                  href="/signup"
                  className="font-medium text-azul underline-offset-4 hover:underline"
                >
                  Empieza 30 días gratis
                </a>
              </p>
            </form>
          )}

          {/* Atribución: el login del tenant reconoce la tecnología detrás. */}
          {brandTheme ? (
            <div className="mt-8 flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
              <p>
                  powered by{" "}
                <a
                  href={FRIG_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Smart APR
                </a>
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/cauce-symbol.svg"
                alt=""
                aria-hidden
                className="h-4 w-auto opacity-60"
              />
            </div>
          ) : (
            <p className={cn("mt-8 text-center text-xs text-muted-foreground")}>
              Cauce — un producto de Smart APR SpA
              <span className="mx-2">·</span>
              <a href="mailto:contacto@smartapr.cl?subject=Solicitud%20de%20Plan%20Piloto" className="font-medium text-sky-300 hover:underline">
                Plan Piloto: contacto@smartapr.cl
              </a>
            </p>
          )}
          </motion.div>
          </AnimatePresence>
          </AuthFormCard>
        </motion.div>

        {success && (
          <DimensionExit
            brandName={brandTheme?.app_name ?? null}
            brandLogo={brandTheme?.logo ?? null}
          />
        )}
      </section>

      {/* Pulso de energía al ingresar */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(120% 120% at 50% 100%, rgba(56,52,255,0.45), transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
