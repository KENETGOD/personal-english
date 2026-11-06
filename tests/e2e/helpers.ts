import { expect, type Page } from "@playwright/test";

const MAILPIT = "http://127.0.0.1:44324";
export const PASSWORD = "Str0ngPassw0rd!x";

export async function confirmationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    const { messages } = (await search.json()) as {
      messages: { ID: string }[];
    };
    if (messages.length > 0) {
      const res = await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`);
      const { HTML } = (await res.json()) as { HTML: string };
      const href = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(HTML)?.[1];
      if (href) {
        // The email carries Supabase site_url (:3000); keep only path + query for the test server.
        const url = new URL(href.replaceAll("&amp;", "&"));
        return url.pathname + url.search;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No confirmation email for ${email}`);
}

/** Registers a new user and confirms the email; ends on /settings with a session. */
export async function signUpAndConfirm(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("status")).toContainText(
    "enlace de verificación",
  );
  await page.goto(await confirmationLink(email));
  await expect(page).toHaveURL(/\/settings$/);
}

export async function logIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}
