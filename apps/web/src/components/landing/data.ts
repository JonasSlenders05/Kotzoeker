export const CAMPUSES = [
  "Schoonmeersen",
  "Sterre",
  "Bijloke",
  "Mercator",
] as const;
export type Campus = (typeof CAMPUSES)[number];

export const SEARCH_EXAMPLES = [
  "Rustig kot met eigen badkamer, max €450…",
  "Studio dicht bij de Overpoort, met fietsenstalling…",
  "Kot met gedeelde keuken, max 10 min fietsen…",
];
