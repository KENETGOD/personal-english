import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PASSWORD, logIn, signUpAndConfirm } from "./helpers";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s). `step` shifts the window to avoid code replay. */
function totp(secret: string, step = 0): string {
  let bits = "";
  for (const c of secret.replace(/\s/g, "").toUpperCase()) {
    bits += BASE32.indexOf(c).toString(2).padStart(5, "0");
  }
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000) + step));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  const n = (h.readUInt32BE(o) & 0x7fffffff) % 1_000_000;
  return n.toString().padStart(6, "0");
}

test("TOTP: enroll, require on login, disable with password", async ({
  page,
}, info) => {
  const email = `e2e-mfa-${info.project.name}-${Date.now()}@example.com`;
  await signUpAndConfirm(page, email);

  await page
    .getByRole("button", { name: "Activar verificación en dos pasos" })
    .click();
  await expect(
    page.getByAltText("Código QR para la app de autenticación"),
  ).toBeVisible();
  const secret = (await page.locator("section code").innerText()).trim();
  await page.getByLabel("Código de verificación").fill(totp(secret));
  await page.getByRole("button", { name: "Confirmar y activar" }).click();
  await expect(
    page.getByText("La verificación en dos pasos está activa"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Password alone is not enough: private routes demand the second factor.
  await logIn(page, email);
  await expect(page).toHaveURL(/\/mfa-challenge$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/mfa-challenge$/);

  await page.getByLabel("Código de verificación").fill("000000");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText(
    "Código incorrecto o vencido.",
  );

  await page.getByLabel("Código de verificación").fill(totp(secret, 1));
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page).toHaveURL(/\/settings$/);

  // Disabling requires the password on top of the AAL2 session.
  await page.getByLabel("Contraseña").fill("WrongPassw0rd!x");
  await page
    .getByRole("button", { name: "Desactivar verificación en dos pasos" })
    .click();
  await expect(page.locator("form [role=alert]")).toHaveText(
    "Contraseña incorrecta.",
  );

  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page
    .getByRole("button", { name: "Desactivar verificación en dos pasos" })
    .click();
  await expect(
    page.getByRole("button", { name: "Activar verificación en dos pasos" }),
  ).toBeVisible();
});
