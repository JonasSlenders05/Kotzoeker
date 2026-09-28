# ADR 0001: Authenticatie en RLS

Status: aanvaard (2026-09-28)

## Context

Kotzoeker heeft drie soorten gebruikers: studenten, kotbazen en beheerders. Elke pagina, Route Handler en Server Action moet weten wie er ingelogd is en welke rol die heeft. Kotbazen mogen enkel hun eigen koten beheren, en een rol mag na het kiezen niet meer veranderen.

De app praat op twee manieren met de database:

- **Drizzle** op de server, via `DATABASE_URL`. Die verbinding draait als databasebeheerder en negeert Row Level Security (RLS).
- **De Supabase-client** in de browser, met de publieke anon key. Die gaat via PostgREST en is onderworpen aan RLS.

Een controle op één van die twee plaatsen beschermt de andere dus niet.

## Beslissing

**Supabase Auth** regelt het inloggen, met drie manieren:

- e-mail en wachtwoord, via Server Actions
- een magic link, met `shouldCreateUser: false` zodat die nooit een account aanmaakt
- Google OAuth

De sessie staat in een cookie (`@supabase/ssr`). Op de server bepalen we de gebruiker met `getClaims()`, dat de handtekening van het token controleert, en nooit met `getSession()`. Alle logins komen terug op `/auth/callback`, die enkel interne paden als `next` aanvaardt.

**Twee sloten**, één per toegangsweg:

1. **Applicatie** (`apps/web/src/lib/auth.ts`): `getCurrentUser`, `requireUser` en `requireRole` zijn de enige plek die beslist wie ingelogd is en wat die mag. Elke pagina, Route Handler en Server Action die kotbaas-data leest of schrijft, begint zelf met `await requireRole('landlord')`; een check in een layout volstaat niet. Dankzij `cache()` kost dat hoogstens één query per request. De DAL (`apps/web/src/server/dal/`) geeft enkel DTO's naar buiten, nooit volledige rijen.
2. **Database** (RLS): RLS staat aan op elke tabel in `public`. Zonder policy is er geen toegang via de Supabase-client. Een gebruiker leest enkel zijn eigen profiel en mag daarin enkel naam, telefoon, avatar en taal wijzigen. `role` en `email` zijn via kolomrechten afgeschermd.

**De rol ligt vast bij registratie of onboarding:**

- Wie registreert via `/registreren`, kiest meteen student of kotbaas.
- Wie voor het eerst met Google inlogt, heeft nog geen rol (`profiles.role` is `null`). Die gebruiker wordt naar `/onboarding` gestuurd.

Beide wegen gebruiken `saveOnboarding`. Die zet de rol enkel als ze nog `null` is en maakt in dezelfde transactie de rij in `student_profiles` of `landlord_profiles` aan. De rol `admin` kan nooit via de app gekozen worden: die zetten we enkel manueel in de database.

## Gevolgen

- Omdat Drizzle RLS negeert, is slot 1 de enige bescherming voor alles wat via de DAL loopt. Vergeet je `requireUser`/`requireRole` in een pagina of Server Action, dan lekt er data. Dit is een vast controlepunt bij elke review.
- RLS is een vangnet voor de browserclient. Een gelekte anon key of een fout in clientcode geeft geen toegang tot andermans gegevens of tot het wijzigen van de rol.
- Foutmeldingen verraden niet wie een account heeft: een fout wachtwoord en een onbekend adres geven dezelfde melding, en de bevestiging van de magic link is altijd dezelfde.
- De magic link gebruikt de PKCE-flow met een `code`. Hij werkt dus enkel in de browser waarin hij aangevraagd werd. De callback aanvaardt ook al `token_hash`, voor een eigen mailtemplate zodra er SMTP is.
- De wachtwoordregels staan op twee plaatsen: in het Zod-schema en in `supabase/config.toml`. Die moeten gelijk blijven.
- Een account zonder profielrij (van vóór de trigger) wordt behandeld als niet ingelogd.
- Een beheerdersaccount aanmaken is een manuele databasehandeling.

## Overwogen alternatieven

- **Drizzle RLS laten respecteren.** Elke query draait dan in een transactie die eerst `set local role authenticated` en de JWT-claims (`request.jwt.claims`) zet, zodat RLS ook voor de serverkant geldt. Voordeel: één beveiligingsmodel, en een vergeten check in de app lekt geen data. Nadelen:
  - een transactie per request, wat extra rondreizen geeft achter de transaction pooler
  - meer complexiteit in de DAL
  - de app heeft `requireRole` toch nog nodig om gebruikers door te sturen

  Voorlopig niet gekozen. We bekijken het opnieuw als de DAL groeit of er meer mensen aan de code werken.
- **Rol altijd via onboarding.** Eenvoudiger, maar wie met een wachtwoord registreert, krijgt dan een extra stap. Verworpen.
- **Rol uit de signup-metadata in de databasetrigger.** Dat was de eerste versie van `handle_new_user`. Google-logins geven geen rol mee, waardoor iedereen stilzwijgend student werd. Verworpen voor de onboardingflow met `role = null`.
- **Eigen authenticatie** (bijvoorbeeld Auth.js). Dat dupliceert wat Supabase al biedt. Bovendien gebruiken de RLS-policies `auth.uid()`, dat enkel met Supabase Auth werkt. Verworpen.
