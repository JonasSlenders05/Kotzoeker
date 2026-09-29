// apps/web/tests/kotbaas.spec.ts
import { expect, test } from "@playwright/test";

test("een kotbaas maakt een kot aan, voegt een foto toe en publiceert", async ({
  page,
}) => {
  const title = `E2E-kot ${Date.now()}`; // uniek, want de testkotbaas blijft bestaan tussen runs

  // 1. Draft met enkel de verplichte velden
  await page.goto("/dashboard/koten/nieuw");
  await page.getByLabel("Titel").fill(title);
  await page.getByLabel("Huur per maand (€)").fill("450");
  await page.getByLabel("Straat").fill("Valentin Vaerwyckweg");
  await page.getByLabel("Huisnummer").fill("1");
  await page.getByLabel("Postcode").fill("9000");
  await page.getByLabel("Gemeente").fill("Gent");
  await page.getByRole("button", { name: "Opslaan als draft" }).click();
  await page.waitForURL(/\/dashboard\/koten\/[0-9a-f-]{36}$/);

  // 2. Publiceren zonder de rest geeft foutmeldingen, geen publicatie
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(
    page.getByText("Vul eerst alle verplichte velden in."),
  ).toBeVisible();

  // 3. De rest invullen
  await page
    .getByLabel("Beschrijving")
    .fill(
      "Lichte kamer met lavabo, gedeelde keuken en fietsenstalling, op wandelafstand van de campus.",
    );
  await page.getByLabel("Kosten per maand (€)").fill("60");
  await page.getByLabel("Oppervlakte (m²)").fill("16");
  await page.getByLabel("Beschikbaar vanaf").fill("2027-09-01");

  // 4. Foto uploaden (verborgen <input type="file"> van de dropzone)
  await page
    .locator('input[type="file"]')
    .setInputFiles("public/images/gent-leie.jpg"); // foto van Gent die al in de repo staat
  await expect(page.getByRole("img", { name: "Foto 1" })).toBeVisible({
    timeout: 30_000,
  });

  // 5. Publiceren en de publieke pagina openen
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Je kot staat online.")).toBeVisible();
  await page.getByRole("link", { name: "Bekijk publieke pagina" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
  await expect(page.getByText("Valentin Vaerwyckweg, 9000 Gent")).toBeVisible();
  await expect(page.getByText(/510,00/)).toBeVisible(); // huur + kosten, Belgisch formaat
});
