// apps/web/tests/rls.spec.ts
import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Deze test praat rechtstreeks met Supabase, zoals een aanvaller met de publieke anon key zou doen.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  noSession,
);
const PASSWORD = "Rlstest12345";

type TestUser = { id: string; client: SupabaseClient };

async function signedInAs(
  email: string,
  role: "student" | "landlord",
): Promise<TestUser> {
  await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  }); // bestaat al: faalt stil

  const client = createClient(url, anonKey, noSession);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error || !data.user)
    throw error ?? new Error(`Inloggen als ${email} mislukt`);

  const id = data.user.id;
  await admin
    .from("profiles")
    .update({ role, first_name: "RLS", last_name: role })
    .eq("id", id)
    .is("role", null);
  await admin
    .from(role === "landlord" ? "landlord_profiles" : "student_profiles")
    .upsert({ profile_id: id });
  return { id, client };
}

async function createListing(
  landlordId: string,
  status: "draft" | "published",
) {
  const { data, error } = await admin
    .from("listings")
    .insert({
      landlord_id: landlordId,
      status,
      title: `RLS-test ${status}`,
      rent_cents: 45000,
      street: "Teststraat",
      house_number: "1",
      postal_code: "9000",
      city: "Gent",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

const webp = () =>
  new Blob([new Uint8Array([82, 73, 70, 70])], { type: "image/webp" });

test.describe.serial("RLS en Storage-policies", () => {
  let a: TestUser; // kotbaas A
  let b: TestUser; // kotbaas B
  let s: TestUser; // student S
  let draftId: string;
  let publishedId: string;
  const photoName = "rls-test.webp";

  test.beforeAll(async () => {
    a = await signedInAs("rls-a@test.local", "landlord");
    b = await signedInAs("rls-b@test.local", "landlord");
    s = await signedInAs("rls-s@test.local", "student");
    draftId = await createListing(a.id, "draft");
    publishedId = await createListing(a.id, "published");

    const { error } = await a.client.storage
      .from("listing-photos")
      .upload(`${draftId}/${photoName}`, webp(), { contentType: "image/webp" });
    if (error) throw error;
  });

  test.afterAll(async () => {
    await admin.storage
      .from("listing-photos")
      .remove([`${draftId}/${photoName}`]);
    await admin.from("listings").delete().in("id", [draftId, publishedId]);
  });

  test("A leest zijn eigen draft", async () => {
    const { data } = await a.client
      .from("listings")
      .select("id")
      .eq("id", draftId);
    expect(data).toHaveLength(1);
  });

  test("B leest de draft van A niet", async () => {
    const { data } = await b.client
      .from("listings")
      .select("id")
      .eq("id", draftId);
    expect(data).toHaveLength(0);
  });

  test("S leest een gepubliceerd kot", async () => {
    const { data } = await s.client
      .from("listings")
      .select("id")
      .eq("id", publishedId);
    expect(data).toHaveLength(1);
  });

  test("B werkt het kot van A niet bij", async () => {
    // RLS geeft hier geen fout, maar raakt gewoon 0 rijen.
    const { data } = await b.client
      .from("listings")
      .update({ title: "Gekaapt" })
      .eq("id", draftId)
      .select("id");
    expect(data ?? []).toHaveLength(0);
  });

  test("S maakt geen kot aan", async () => {
    const { error } = await s.client.from("listings").insert({
      landlord_id: s.id,
      title: "Kot van een student",
      rent_cents: 100,
      street: "x",
      house_number: "1",
      postal_code: "9000",
      city: "Gent",
    });
    expect(error).not.toBeNull();
  });

  test("niet ingelogd leest geen profielen", async () => {
    const anonymous = createClient(url, anonKey, noSession);
    const { data } = await anonymous.from("profiles").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  test("B uploadt niet in de map van A", async () => {
    const { error } = await b.client.storage
      .from("listing-photos")
      .upload(`${draftId}/indringer.webp`, webp(), {
        contentType: "image/webp",
      });
    expect(error).not.toBeNull();
  });

  test("B verwijdert geen foto van A", async () => {
    const { data } = await b.client.storage
      .from("listing-photos")
      .remove([`${draftId}/${photoName}`]);
    expect(data ?? []).toHaveLength(0);

    const { data: files } = await a.client.storage
      .from("listing-photos")
      .list(draftId);
    expect(files?.some((f) => f.name === photoName)).toBe(true);
  });

  test("S wijzigt zijn eigen rol niet", async () => {
    const { error } = await s.client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", s.id);
    expect(error).not.toBeNull();
  });
});
