import { describe, expect, it } from "vitest";
import { normalizeRole } from "@/lib/store/session";
import { ApiError, emptyOnForbidden } from "@/lib/api/client";

describe("normalizeRole", () => {
  it("METER (código backend) se trata como MEDIDOR en la UI", () => {
    expect(normalizeRole("METER")).toBe("MEDIDOR");
    expect(normalizeRole(" meter ")).toBe("MEDIDOR");
  });

  it("el resto de roles solo se normaliza a mayúsculas", () => {
    expect(normalizeRole("cajero")).toBe("CAJERO");
    expect(normalizeRole("ADMIN_LOCAL")).toBe("ADMIN_LOCAL");
    expect(normalizeRole("MEDIDOR")).toBe("MEDIDOR");
    expect(normalizeRole("")).toBeUndefined();
    expect(normalizeRole(null)).toBeUndefined();
  });
});

describe("emptyOnForbidden", () => {
  it("403 → página vacía", async () => {
    const page = await emptyOnForbidden(Promise.reject(new ApiError(403, "sin permiso")));
    expect(page).toEqual({ count: 0, next: null, previous: null, results: [] });
  });

  it("otros errores se propagan", async () => {
    await expect(emptyOnForbidden(Promise.reject(new ApiError(500, "boom")))).rejects.toThrow("boom");
  });

  it("respuesta OK pasa intacta", async () => {
    const data = { count: 1, next: null, previous: null, results: [{ id: 1 }] };
    await expect(emptyOnForbidden(Promise.resolve(data))).resolves.toBe(data);
  });
});
