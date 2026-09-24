-- Seed voor lokale ontwikkeling (draait na de migraties bij `supabase db reset`).
-- Alle personen, adressen en coördinaten hieronder zijn fictief of bij benadering.

-- ---------- voorzieningen ----------
insert into public.amenities (key, label_nl, label_en, category, shareable) values
  ('bathroom',        'Badkamer (douche/bad)', 'Bathroom',        'sanitary', true),
  ('toilet',          'Toilet',                'Toilet',          'sanitary', true),
  ('sink',            'Lavabo',                'Sink',            'sanitary', true),
  ('kitchen',         'Keuken',                'Kitchen',         'kitchen',  true),
  ('fridge',          'Koelkast',              'Fridge',          'kitchen',  true),
  ('washing_machine', 'Wasmachine',            'Washing machine', 'building', true),
  ('bike_storage',    'Fietsenstalling',       'Bike storage',    'building', true),
  ('furnished',       'Bemeubeld',             'Furnished',       'comfort',  false),
  ('wifi',            'Wifi',                  'Wi-Fi',           'comfort',  false);

-- ---------- instellingen en campussen ----------
insert into public.institutions (id, name, short_name, website) values
  ('10000000-0000-0000-0000-000000000001', 'Hogeschool Gent',    'HOGENT', 'https://www.hogent.be'),
  ('10000000-0000-0000-0000-000000000002', 'Universiteit Gent',  'UGent',  'https://www.ugent.be');

insert into public.campuses (id, institution_id, name, postal_code, city, lat, lng) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Campus Schoonmeersen', '9000', 'Gent', 51.0327, 3.7068),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Campus Mercator',      '9000', 'Gent', 51.0567, 3.7367),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Campus Sterre',        '9000', 'Gent', 51.0258, 3.7112),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Campus Boekentoren',   '9000', 'Gent', 51.0453, 3.7261);

-- ---------- fictieve kotbazen ----------
-- De trigger on_auth_user_created maakt hiervoor profiles + landlord_profiles aan.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'els.vermeulen@example.com', '', now(),
   '{"provider":"email","providers":["email"]}', '{"role":"landlord","first_name":"Els","last_name":"Vermeulen"}', now(), now(),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'marc.desmet@example.com', '', now(),
   '{"provider":"email","providers":["email"]}', '{"role":"landlord","first_name":"Marc","last_name":"De Smet"}', now(), now(),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'sofie.peeters@example.com', '', now(),
   '{"provider":"email","providers":["email"]}', '{"role":"landlord","first_name":"Sofie","last_name":"Peeters"}', now(), now(),
   '', '', '', '');

-- ---------- listings ----------
insert into public.listings (
  id, landlord_id, type, status, title, description,
  rent_cents, costs_cents, costs_included, deposit_cents, size_m2,
  street, house_number, postal_code, city, lat, lng,
  available_from, lease_type, min_lease_months, has_conformity_certificate, epc_label, published_at
) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'room', 'published',
   'Lichte kamer vlakbij de Overpoort', 'Ruime kamer op de eerste verdieping, gedeelde keuken en living.',
   45000, 6000, false, 90000, 16,
   'Overpoortstraat', '12', '9000', 'Gent', 51.0389, 3.7269,
   '2027-09-01', 'academic_year', 10, true, 'C', now()),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'studio', 'published',
   'Instapklare studio met eigen badkamer', 'Volledig ingerichte studio, alles inbegrepen.',
   62000, 0, true, 124000, 24,
   'Sint-Pietersnieuwstraat', '45', '9000', 'Gent', 51.0459, 3.7266,
   '2027-09-01', 'academic_year', 10, true, 'B', now()),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'shared_house', 'published',
   'Kamer in gedeeld huis (5 studenten)', 'Gezellig studentenhuis met tuin en fietsenstalling.',
   38000, 8000, false, 76000, 14,
   'Voskenslaan', '8', '9000', 'Gent', 51.0355, 3.7118,
   '2027-09-01', 'academic_year', 10, true, 'D', now()),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'apartment', 'published',
   'Appartement voor twee, dicht bij Campus Mercator', 'Twee slaapkamers, balkon, vlot bereikbaar met de fiets.',
   85000, 9500, false, 170000, 55,
   'Henleykaai', '30', '9000', 'Gent', 51.0571, 3.7359,
   '2026-10-15', 'flexible', 6, true, 'B', now()),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'room', 'published',
   'Betaalbare kamer, jaarcontract', 'Kamer met lavabo, gedeelde badkamer en toilet.',
   35000, 7000, false, 70000, 12,
   'Kortrijksesteenweg', '100', '9000', 'Gent', 51.0290, 3.7042,
   '2027-09-01', 'full_year', 12, false, 'E', now()),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'studio', 'draft',
   'Studio in opbouw (concept)', null,
   58000, 0, true, null, null,
   'Koningin Fabiolalaan', '22', '9000', 'Gent', 51.0301, 3.7095,
   null, 'academic_year', null, false, null, null);

-- ---------- voorzieningen per kot ----------
insert into public.listing_amenities (listing_id, amenity_key, is_shared, shared_with) values
  ('30000000-0000-0000-0000-000000000001', 'bathroom',        true,  3),
  ('30000000-0000-0000-0000-000000000001', 'toilet',          true,  3),
  ('30000000-0000-0000-0000-000000000001', 'sink',            false, null),
  ('30000000-0000-0000-0000-000000000001', 'kitchen',         true,  3),
  ('30000000-0000-0000-0000-000000000001', 'wifi',            false, null),
  ('30000000-0000-0000-0000-000000000002', 'bathroom',        false, null),
  ('30000000-0000-0000-0000-000000000002', 'toilet',          false, null),
  ('30000000-0000-0000-0000-000000000002', 'sink',            false, null),
  ('30000000-0000-0000-0000-000000000002', 'kitchen',         false, null),
  ('30000000-0000-0000-0000-000000000002', 'fridge',          false, null),
  ('30000000-0000-0000-0000-000000000002', 'furnished',       false, null),
  ('30000000-0000-0000-0000-000000000002', 'wifi',            false, null),
  ('30000000-0000-0000-0000-000000000003', 'bathroom',        true,  4),
  ('30000000-0000-0000-0000-000000000003', 'toilet',          true,  4),
  ('30000000-0000-0000-0000-000000000003', 'kitchen',         true,  4),
  ('30000000-0000-0000-0000-000000000003', 'washing_machine', true,  4),
  ('30000000-0000-0000-0000-000000000003', 'bike_storage',    true,  4),
  ('30000000-0000-0000-0000-000000000003', 'wifi',            false, null),
  ('30000000-0000-0000-0000-000000000004', 'bathroom',        false, null),
  ('30000000-0000-0000-0000-000000000004', 'toilet',          false, null),
  ('30000000-0000-0000-0000-000000000004', 'kitchen',         false, null),
  ('30000000-0000-0000-0000-000000000004', 'washing_machine', false, null),
  ('30000000-0000-0000-0000-000000000004', 'furnished',       false, null),
  ('30000000-0000-0000-0000-000000000005', 'sink',            false, null),
  ('30000000-0000-0000-0000-000000000005', 'bathroom',        true,  2),
  ('30000000-0000-0000-0000-000000000005', 'toilet',          true,  2),
  ('30000000-0000-0000-0000-000000000005', 'kitchen',         true,  2);
