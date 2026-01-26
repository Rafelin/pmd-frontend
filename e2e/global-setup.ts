import type { FullConfig } from "@playwright/test";
import { request } from "@playwright/test";

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.PLAYWRIGHT_API_URL || "http://localhost:3001";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

function unwrapData<T>(payload: any): T {
  return (payload && typeof payload === "object" && "data" in payload ? (payload as any).data : payload) as T;
}

export default async function globalSetup(_config: FullConfig) {
  const apiBaseURL = getApiBaseUrl();

  const ctx = await request.newContext({
    baseURL: apiBaseURL,
    ignoreHTTPSErrors: true,
  });

  try {
    // CSRF token (si está habilitado en backend)
    const csrfResp = await ctx.get("/auth/csrf-token");
    const csrfJson = csrfResp.ok() ? await csrfResp.json().catch(() => null) : null;
    const csrfToken: string | undefined = csrfJson?.csrfToken;

    // Login como Direction (usuario de tests)
    const loginResp = await ctx.post("/auth/login", {
      data: { email: "direction@pmd.com", password: "password123" },
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
    });

    if (!loginResp.ok()) {
      const text = await loginResp.text().catch(() => "");
      throw new Error(`[globalSetup] Login falló (${loginResp.status()}): ${text}`);
    }

    const loginJson = await loginResp.json();
    const accessToken: string | undefined = loginJson?.accessToken || loginJson?.access_token;
    if (!accessToken) {
      throw new Error(`[globalSetup] Login OK pero no devolvió accessToken`);
    }

    const authHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    };

    // Seed: asegurar Obra "Test Work" (muchos E2E buscan "Test")
    const worksResp = await ctx.get("/works", { headers: authHeaders });
    const worksJson = worksResp.ok() ? await worksResp.json().catch(() => []) : [];
    const works = unwrapData<any[]>(worksJson) || [];
    const hasTestWork = Array.isArray(works) && works.some((w) => String(w?.name || w?.nombre || "").toLowerCase().includes("test"));

    if (!hasTestWork) {
      const createWorkResp = await ctx.post("/works", {
        headers: authHeaders,
        data: {
          name: "Test Work",
          client: "Test Client",
          address: "Test Address 123",
          start_date: "2026-01-19",
          currency: "ARS",
        },
      });

      if (!createWorkResp.ok()) {
        const text = await createWorkResp.text().catch(() => "");
        throw new Error(`[globalSetup] No se pudo crear Test Work (${createWorkResp.status()}): ${text}`);
      }
    }

    // Seed: asegurar Proveedor "Test Supplier"
    const suppliersResp = await ctx.get("/suppliers", { headers: authHeaders });
    const suppliersJson = suppliersResp.ok() ? await suppliersResp.json().catch(() => []) : [];
    const suppliers = unwrapData<any[]>(suppliersJson) || [];
    const hasTestSupplier = Array.isArray(suppliers) && suppliers.some((s) => String(s?.name || s?.nombre || "").toLowerCase().includes("test"));

    if (!hasTestSupplier) {
      const createSupplierResp = await ctx.post("/suppliers", {
        headers: authHeaders,
        data: {
          name: "Test Supplier",
          status: "approved",
          // CUIT con dígito verificador válido (evita 400 por checksum)
          cuit: "20-12345678-6",
        },
      });

      if (!createSupplierResp.ok()) {
        const text = await createSupplierResp.text().catch(() => "");
        throw new Error(`[globalSetup] No se pudo crear Test Supplier (${createSupplierResp.status()}): ${text}`);
      }
    }
  } finally {
    await ctx.dispose();
  }
}

