export const formatEuro = (cents: number) =>
  new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "long",
    timeZone: "Europe/Brussels",
  }).format(new Date(isoDate));
