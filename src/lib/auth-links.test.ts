import { describe, expect, it } from "vitest";
import {
  loginHrefFromInvitationPath,
  readQueryToken,
  readResetOrInvitationToken,
} from "@/lib/auth-links";

describe("token de recuperación e invitación", () => {
  it("decodifica el token de /reset-password/[token]", () => {
    expect(readResetOrInvitationToken("/reset-password/abc%2Bdef%3D")).toBe("abc+def=");
    expect(readResetOrInvitationToken("/reset-password/abc%2Bdef%3D/")).toBe("abc+def=");
    expect(readResetOrInvitationToken("/reset-password/__")).toBe("");
  });

  it("lee el token en la ruta de invitación y en el enlace con slug", () => {
    expect(readResetOrInvitationToken("/accept-invitation/tok%2B1")).toBe("tok+1");
    expect(
      readResetOrInvitationToken("/login/apr-rio/reset-password/uid%3Atoken"),
    ).toBe("uid:token");
  });

  it("el correo de nuevo acceso /login/<slug>/login abre el login de esa sucursal", () => {
    expect(loginHrefFromInvitationPath("/login/apr-rio/login", "")).toBe(
      "/login?branch=apr-rio",
    );
    expect(
      loginHrefFromInvitationPath("/login/apr%2Drio/login/", "?token=a%2Bb@c.cl:sig"),
    ).toBe("/login?branch=apr-rio&token=a%2Bb%40c.cl%3Asig");
  });
});

describe("token de query con +", () => {
  it("un correo con + codificado como %2B no se convierte en espacio", () => {
    expect(readQueryToken("?token=nombre%2Balias@dominio.cl:abc", "token")).toBe(
      "nombre+alias@dominio.cl:abc",
    );
  });

  it("un + literal en el token (sin codificar) tampoco se convierte en espacio", () => {
    expect(readQueryToken("?token=nombre+alias@dominio.cl:abc", "token")).toBe(
      "nombre+alias@dominio.cl:abc",
    );
  });
});
