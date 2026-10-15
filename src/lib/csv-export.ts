/** Escape a value for CSV and prevent spreadsheet formula execution.
 * Leading whitespace and invisible formatting characters must not bypass
 * the formula guard when a user opens an exported report in a spreadsheet.
 */
export function csvCell(value: string): string {
  const formulaLike = /^[\s\u200B-\u200D\uFEFF]*[=+\-@]/u.test(value);
  const escaped = (formulaLike ? "'" : "") + value;
  return '"' + escaped.replaceAll('"', '""') + '"';
}
