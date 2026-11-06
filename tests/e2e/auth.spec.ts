import { expect, test } from "@playwright/test";

import { PASSWORD, confirmationLink } from "./helpers";

test("private routes redirect anonymous users and send the CSP", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);

  const res = await page.goto("/login");
  const headers = res!.headers();
  expect(headers["content-security-policy-report-only"]).toContain("nonce-");
  expect(headers["x-content-type-options"]).toBe("nosniff");
});

test("sign up, confirm by email, log out and log in", async ({
  page,
}, info) => {
  const email = `e2e-${info.project.name}-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("status")).toContainText(
    "enlace de verificación",
  );

  // No access before the email is confirmed (RF-AUTH-01), and no hint about why.
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText(
    "Correo o contraseña incorrectos.",
  );

  // Confirm through the emailed link: lands on settings with a session.
  await page.goto(await confirmationLink(email));
  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    page.getByRole("heading", { name: "Ajustes", level: 1 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/settings$/);

  // Settings round trip.
  await page.getByLabel("Nombre").fill("Ana");
  // Choice chips hide the native radio; force the click through the label.
  await page.getByRole("radio", { name: "20 min" }).check({ force: true });
  await page
    .getByRole("radio", { name: "Británico (en-GB)" })
    .check({ force: true });
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status")).toHaveText("Cambios guardados.");
  await page.reload();
  await expect(page.getByLabel("Nombre")).toHaveValue("Ana");
  await expect(page.getByRole("radio", { name: "20 min" })).toBeChecked();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("password recovery answers the same for unknown accounts", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Correo electrónico").fill("nobody-here@example.com");
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("status")).toContainText("Si existe una cuenta");
});
