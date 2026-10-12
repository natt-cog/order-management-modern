// SiteProperty_GetCurrency: "€"
export const money = (n: number | string | null | undefined) =>
  "€ " + Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const day = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "-");
