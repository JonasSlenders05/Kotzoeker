// apps/web/tests/auth.setup.ts
import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Enkel in tests: de service role key omzeilt RLS en hoort nooit in browsercode.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const email = "kotbaas@test.local";
const password = "Kotbaas12345";

setup("log in als kotbaas", async ({ page }) => {
  const { data: created } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  const userId = created.user?.id;
  if (userId) {
    // De trigger maakte al een profiel zonder rol; zet de rol zoals de registratie dat doet.
    await admin
      .from("profiles")
      .update({ role: "landlord", first_name: "Test", last_name: "Kotbaas" })
      .eq("id", userId);
    await admin.from("landlord_profiles").insert({ profile_id: userId });
  }

  await page.goto("/login");
  await page.getByLabel("E-mailadres").fill(email);
  // getByRole: getByLabel vindt ook het tabblad "Wachtwoord" op de loginpagina.
  await page.getByRole("textbox", { name: "Wachtwoord" }).fill(password);
  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await page.context().storageState({ path: "tests/.auth/kotbaas.json" });
});
