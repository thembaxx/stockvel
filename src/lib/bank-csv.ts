import { parseRand } from "./money";
export type ImportedTransaction = { id: string; date: string; reference: string; amount: bigint };
/** Deliberately explicit import contract. Banks' native formats require reviewed adapters. */
export function parseBankCsv(csv: string): ImportedTransaction[] {
  if (csv.length > 1_000_000) throw new Error("The CSV is too large. Maximum file size is 1 MB.");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quoted && cell !== "") throw new Error("Malformed quoted CSV field.");
      else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && csv[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  const header = rows.shift()?.map((v) =>
    v
      .trim()
      .toLowerCase()
      .replace(/^\uFEFF/, ""),
  );
  if (header?.join(",") !== "id,date,reference,amount")
    throw new Error("Use the exact CSV columns: id,date,reference,amount.");
  if (!rows.length || rows.length > 5000)
    throw new Error("Include between 1 and 5,000 bank transactions.");
  const result = new Map<string, ImportedTransaction>();
  rows.forEach((r, index) => {
    if (r.length !== 4) throw new Error(`Row ${index + 2}: expected four columns.`);
    const [id, date, reference, amountText] = r.map((c) => c.trim());
    if (!id || id.length > 100 || !reference || reference.length > 200)
      throw new Error(`Row ${index + 2}: invalid transaction ID or reference.`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      throw new Error(`Row ${index + 2}: use a valid YYYY-MM-DD date.`);
    const amount = parseRand(amountText);
    if (amount <= 0n) throw new Error(`Row ${index + 2}: incoming amounts must be positive.`);
    const existing = result.get(id);
    if (
      existing &&
      (existing.date !== date || existing.reference !== reference || existing.amount !== amount)
    )
      throw new Error(`Row ${index + 2}: transaction ID is reused with conflicting details.`);
    result.set(id, { id, date, reference, amount });
  });
  return [...result.values()];
}
