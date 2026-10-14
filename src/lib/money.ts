/** All money is represented as integer cents. Never parse financial input as a float. */
export function parseRand(value: string): bigint {
  const clean = value.trim().replace(/^R\s*/, "");
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(clean))
    throw new Error("Enter an amount such as 500 or 500.00.");
  const [whole, fraction = ""] = clean.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export function formatZar(cents: bigint, decimals = true): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const rands = new Intl.NumberFormat("en-ZA").format(absolute / 100n).replace(/\u00a0/g, " ");
  return `${negative ? "−" : ""}R ${rands}${decimals ? `.${(absolute % 100n).toString().padStart(2, "0")}` : ""}`;
}

export function centsToDecimal(cents: bigint): string {
  const sign = cents < 0n ? "-" : "";
  const value = cents < 0n ? -cents : cents;
  return `${sign}${value / 100n}.${(value % 100n).toString().padStart(2, "0")}`;
}
