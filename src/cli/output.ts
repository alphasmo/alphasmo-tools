import { toCsv } from "./csv.js";

export type OutputFormat = "json" | "compact" | "table" | "csv";

export function printResult(
  data: unknown,
  format: OutputFormat,
  renderTable: (data: never) => string,
): void {
  if (format === "table") {
    process.stdout.write(`${renderTable(data as never)}\n`);
    return;
  }
  if (format === "csv") {
    process.stdout.write(toCsv(data));
    return;
  }
  if (format === "compact") {
    process.stdout.write(`${JSON.stringify(data)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}
