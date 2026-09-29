# ADR 0002: Foto's en Storage

Status: voorgesteld (2026-09-29)

## Context

Een kotbaas uploadt per kot tot 20 foto's, meestal rechtstreeks van zijn gsm. Zo'n foto is 4 tot 8 MB en bevat vaak GPS-gegevens. Studenten bekijken de foto's op een publieke kotpagina, die gedeeld wordt in groepschats. Supabase Free geeft geen image transformations, dus Supabase kan geen kleinere versies maken.

## Beslissing

**Rechtstreeks van de browser naar Storage.** De browser uploadt naar de bucket `listing-photos` met de Supabase-client en de sessie van de gebruiker. De bestanden gaan dus niet via onze Next.js-server. Daarna registreert de Server Action `addListingPhoto` de rij in `listing_photos`.

**Thumbnails in de browser.** Met `browser-image-compression` maakt de browser van elke foto twee webp-versies: 1600 px (±500 KB) en 400 px (±50 KB). Het hercomprimeren haalt ook de EXIF-gegevens weg, en daarmee de GPS-locatie.

**Vaste paden.** Elk bestand staat op `{listing_id}/{photo_id}.webp`, met de thumbnail op `{listing_id}/{photo_id}_thumb.webp`. Het id van de rij in `listing_photos` is ook de bestandsnaam. De browser stuurt nooit een pad mee: de server bouwt het zelf uit `listingId` en `photoId`.

**Publieke bucket.** Iedereen mag de bestanden lezen via hun publieke URL. Schrijven, overschrijven en verwijderen mag enkel de eigenaar van het kot. De policies op `storage.objects` controleren dat met `public.owns_listing_folder`: is de eerste map van het pad een kot van `auth.uid()`? De bucket aanvaardt enkel webp tot 5 MB.

**De database is de bron van waarheid.** Enkel foto's met een rij in `listing_photos` bestaan voor de app. Volgorde en coverfoto staan in die tabel (`position`, `is_cover`), niet in Storage.

## Gevolgen

- De Storage-policies zijn het enige wat ongewenste uploads tegenhoudt, want de upload gaat niet langs slot 1. Een fout in `owns_listing_folder` is dus meteen een lek. De RLS-test in `apps/web/tests/rls.spec.ts` controleert dit.
- Iedereen die de URL van een foto kent, kan ze zien, ook van een kot in draft. De paden bevatten twee uuid's en zijn niet te raden, maar ze zijn niet geheim. Voor kotfoto's is dat aanvaardbaar.
- Uploaden gebeurt in twee stappen. Mislukt de tweede stap, dan blijft er een bestand in Storage zonder rij. Dat is onzichtbaar voor de app. Bij verwijderen gaat eerst de rij weg en dan de bestanden, zodat de app nooit een kapotte foto toont.
- Twee uploads tegelijk voor hetzelfde kot wachten op elkaar via `SELECT … FOR UPDATE` op het kot. Zo zijn er nooit twee covers of dubbele posities.
- `next/image` optimaliseert niets (`images.unoptimized`): de browser levert al de juiste maat.
- HEIC-foto's van een iPhone worden geweigerd, omdat de meeste browsers ze niet kunnen lezen.

## Overwogen alternatieven

- **Uploaden via een Server Action of Route Handler.** Eenvoudiger te beveiligen, want alles loopt langs slot 1. Maar elke foto gaat dan twee keer over het netwerk, en Vercel beperkt de grootte van een request body (±4,5 MB), kleiner dan een gsm-foto. Verworpen.
- **Signed upload URL's** (`createSignedUploadUrl`). De server geeft per foto een eenmalige URL. Dat vervangt de insert-policy door een check in de app, maar het kost een extra rondreis per foto. Een goede optie als de policies te complex worden.
- **Een private bucket met signed URL's om te lezen.** Beter voor privacy, maar signed URL's verlopen, worden slecht gecachet en werken niet in een Open Graph-preview. Verworpen voor kotfoto's. Voor latere documenten, zoals huurcontracten, is een private bucket wel de juiste keuze.
- **Thumbnails op de server** (sharp, of image transformations op een betaald plan). Betere kwaliteit en controle, maar extra rekenkracht of kosten. We bekijken het opnieuw bij een betaald Supabase-plan.
