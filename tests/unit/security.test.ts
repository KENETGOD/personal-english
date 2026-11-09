import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/security/csp";
import { securityHeaders } from "@/lib/security/headers";
import { isPrivatePath } from "@/lib/security/routes";
import { hardenCookie } from "@/lib/supabase/cookie-options";

describe("buildCsp", () => {
  const base = { nonce: "abc123", supabaseUrl: "https://proj.supabase.co" };

  it("uses the nonce, forbids framing and allows Supabase", () => {
    const csp = buildCsp({ ...base, isDev: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain(
      "connect-src 'self' https://proj.supabase.co wss://proj.supabase.co",
    );
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("relaxes only what dev tooling needs and supports a local http URL", () => {
    const csp = buildCsp({
      ...base,
      supabaseUrl: "http://127.0.0.1:54321",
      isDev: true,
    });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws://127.0.0.1:54321");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});

describe("securityHeaders", () => {
  it("allows the microphone only for self", () => {
    const h = Object.fromEntries(securityHeaders.map((x) => [x.key, x.value]));
    expect(h["Permissions-Policy"]).toContain("microphone=(self)");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Strict-Transport-Security"]).toContain("max-age=");
  });
});

describe("isPrivatePath", () => {
  it.each(["/home", "/settings", "/settings/security"])("protects %s", (p) => {
    expect(isPrivatePath(p)).toBe(true);
  });

  it.each(["/", "/login", "/homework", "/settingsfoo", "/auth/confirm"])(
    "leaves %s public",
    (p) => {
      expect(isPrivatePath(p)).toBe(false);
    },
  );
});

describe("hardenCookie", () => {
  it("forces HttpOnly and SameSite=Lax over the library defaults", () => {
    const c = hardenCookie({ httpOnly: false, sameSite: "none", path: "/" });
    expect(c).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });
});
