import { describe, expect, it } from "vitest";
import {
  BACKEND_CHECKOUT_TYPES,
  buildCauceCheckoutBody,
  CAUCE_CHECKOUT_TYPE,
  mapSignupApiError,
  validateSignupForm,
} from "@/lib/cauce-checkout";

describe("contrato checkout_type", () => {
  it("el body usa una choice válida del backend (no 'cauce')", () => {
    const body = buildCauceCheckoutBody({
      business_name: "APR Norte",
      contact_name: "Ana",
      email: "ana@apr.cl",
      plan_id: "comunidad",
    });
    expect(BACKEND_CHECKOUT_TYPES).toContain(body.checkout_type);
    expect(body.checkout_type).toBe(CAUCE_CHECKOUT_TYPE);
    expect(body.checkout_type).not.toBe("cauce");
    // Solo los 4 campos del form + checkout_type: nada de organización.
    expect(Object.keys(body).sort()).toEqual(
      ["business_name", "checkout_type", "contact_name", "email", "plan_id"].sort(),
    );
  });
});

describe("validateSignupForm largos del backend", () => {
  it("exige mínimo 2 caracteres en nombres", () => {
    const errors = validateSignupForm({
      business_name: "A",
      contact_name: "B",
      email: "a@b.cl",
      plan_id: "comunidad",
    });
    expect(errors.business_name).toMatch(/al menos 2/);
    expect(errors.contact_name).toMatch(/al menos 2/);
  });
});

describe("mapSignupApiError", () => {
  it("mapea errores 400 por campo", () => {
    const res = mapSignupApiError({
      status: 400,
      detail: {
        email: ["Introduzca una dirección de correo electrónico válida."],
        plan_id: ["Plan inválido. Opciones: comunidad, crecimiento."],
        business_name: ["Este campo es requerido."],
      },
    });
    expect(res.fieldErrors.email).toBe("Correo inválido. Revisa que esté bien escrito.");
    expect(res.fieldErrors.plan_id).toBe("Plan inválido. Opciones: comunidad, crecimiento.");
    expect(res.fieldErrors.business_name).toBe("Indica el nombre de tu APR.");
    expect(res.formError).toBeNull();
  });

  it("campos fuera del form van al mensaje general con etiqueta en español", () => {
    const res = mapSignupApiError({
      status: 400,
      detail: { checkout_type: ['"cauce" no es una elección válida.'] },
    });
    expect(res.fieldErrors).toEqual({});
    expect(res.formError).toBe('Tipo de registro: "cauce" no es una elección válida.');
  });

  it("traduce mensajes DRF en inglés", () => {
    const res = mapSignupApiError({
      status: 400,
      detail: {
        contact_name: ["Ensure this field has at least 2 characters."],
        email: ["Enter a valid email address."],
      },
    });
    expect(res.fieldErrors.contact_name).toBe("Debe tener al menos 2 caracteres.");
    expect(res.fieldErrors.email).toMatch(/Correo inválido/);
  });

  it("429 / 409 / 503 con mensajes claros", () => {
    expect(mapSignupApiError({ status: 429, detail: {} }).formError).toMatch(
      /Demasiados intentos/,
    );
    expect(mapSignupApiError({ status: 409, detail: {} }).fieldErrors.email).toMatch(
      /inicia sesión/,
    );
    expect(mapSignupApiError({ status: 503, detail: {} }).formError).toMatch(
      /no está disponible/,
    );
  });

  it("detail/non_field_errors van al mensaje general", () => {
    expect(
      mapSignupApiError({ status: 400, detail: { non_field_errors: ["Algo falló."] } })
        .formError,
    ).toBe("Algo falló.");
  });

  it("500 sin cuerpo → mensaje genérico de servidor", () => {
    expect(mapSignupApiError({ status: 500, detail: null }).formError).toMatch(
      /problema en el servidor/,
    );
  });
});
