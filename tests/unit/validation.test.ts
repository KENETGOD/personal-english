import { describe, expect, it } from "vitest";
import {
  disableTotpSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyTotpSchema,
} from "@/lib/validation/auth";
import { isValidTimezone, settingsSchema } from "@/lib/validation/profile";

describe("signUpSchema", () => {
  const ok = { email: " User@Example.com ", password: "Abcdefghij12" };

  it("normalizes the email", () => {
    expect(signUpSchema.parse(ok).email).toBe("user@example.com");
  });

  it.each([
    ["too short", "Abcdef12"],
    ["no digit", "Abcdefghijkl"],
    ["no uppercase", "abcdefghij12"],
    ["no lowercase", "ABCDEFGHIJ12"],
    ["too long", `Ab1${"x".repeat(70)}`],
  ])("rejects a password that is %s", (_, password) => {
    expect(signUpSchema.safeParse({ ...ok, password }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...ok, email: "nope" }).success).toBe(
      false,
    );
  });
});

describe("signInSchema", () => {
  it("does not enforce the password policy on login", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.co", password: "x" }).success,
    ).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching passwords", () => {
    const r = resetPasswordSchema.safeParse({
      password: "Abcdefghij12",
      confirm: "other",
    });
    expect(r.success).toBe(false);
  });
});

describe("MFA schemas", () => {
  const factorId = "7b7d1c55-0d1a-4c1e-9f3b-2d0a8e1c9a11";

  it("accepts a 6-digit code only", () => {
    expect(
      verifyTotpSchema.safeParse({ factorId, code: "123456" }).success,
    ).toBe(true);
    expect(
      verifyTotpSchema.safeParse({ factorId, code: "12345" }).success,
    ).toBe(false);
    expect(
      verifyTotpSchema.safeParse({ factorId, code: "12345a" }).success,
    ).toBe(false);
  });

  it("requires a uuid factor id and a password to disable", () => {
    expect(
      disableTotpSchema.safeParse({ factorId: "x", password: "p" }).success,
    ).toBe(false);
    expect(
      disableTotpSchema.safeParse({ factorId, password: "" }).success,
    ).toBe(false);
  });
});

describe("isValidTimezone", () => {
  it.each(["America/Mexico_City", "Europe/Madrid", "UTC"])(
    "accepts %s",
    (tz) => {
      expect(isValidTimezone(tz)).toBe(true);
    },
  );

  it.each(["", "Mars/Olympus", "mexico", "america/mexico_city"])(
    "rejects %j",
    (tz) => {
      expect(isValidTimezone(tz)).toBe(false);
    },
  );
});

describe("settingsSchema", () => {
  const ok = {
    displayName: "  Ana ",
    timezone: "America/Mexico_City",
    dailyGoal: "20",
    accent: "en-GB",
    playbackRate: "0.75",
    interests: ["travel", "work"],
  };

  it("parses form strings into typed values", () => {
    expect(settingsSchema.parse(ok)).toEqual({
      ...ok,
      displayName: "Ana",
      dailyGoal: 20,
      playbackRate: 0.75,
    });
  });

  it.each([
    ["goal", { dailyGoal: "25" }],
    ["accent", { accent: "es-MX" }],
    ["rate", { playbackRate: "2" }],
    ["interest", { interests: ["sports"] }],
    ["name length", { displayName: "x".repeat(61) }],
    ["timezone", { timezone: "Nowhere/City" }],
  ])("rejects an invalid %s", (_, patch) => {
    expect(settingsSchema.safeParse({ ...ok, ...patch }).success).toBe(false);
  });
});
