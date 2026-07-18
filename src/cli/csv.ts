function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * Turns a JSON-shaped value into CSV. An array of objects becomes one row per item (columns
 * from the first item's keys); a single object becomes one row; anything else becomes a single
 * cell. Nested object/array field values are JSON-stringified into their cell rather than
 * flattened, since the response schemas this wraps vary in nesting depth per endpoint.
 */
export function toCsv(data: unknown): string {
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return "";

  const first = rows[0];
  if (first === null || typeof first !== "object") {
    return `${rows.map((r) => csvCell(r)).join("\n")}\n`;
  }

  const headers = Object.keys(first as Record<string, unknown>);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell((row as Record<string, unknown>)[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}
