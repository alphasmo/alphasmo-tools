import { AlphasmoClient, DEFAULT_BASE_URL } from "../client.js";
import { exitCodeForError, messageForError } from "./exit-codes.js";
import { type OutputFormat, printResult } from "./output.js";

export interface GlobalOptions {
  apiKey?: string;
  baseUrl?: string;
  format?: OutputFormat;
  json?: boolean;
}

export function buildClient(opts: GlobalOptions): AlphasmoClient {
  return new AlphasmoClient({
    apiKey: opts.apiKey ?? process.env.ALPHASMO_API_KEY,
    baseUrl: opts.baseUrl ?? process.env.ALPHASMO_BASE_URL ?? DEFAULT_BASE_URL,
    clientName: "cli",
  });
}

/**
 * No explicit --format/--json → auto-detect: a human typing directly into a terminal (stdout is
 * a TTY) gets a readable table; anything piped or spawned as a subprocess (scripts, AI agents)
 * gets JSON, since that's the safe default for machine consumption. --format/--json always wins
 * when passed explicitly.
 */
export function resolveFormat(opts: GlobalOptions): OutputFormat {
  if (opts.json) return "json";
  if (opts.format) return opts.format;
  return process.stdout.isTTY ? "table" : "json";
}

export async function runAction<T>(
  opts: GlobalOptions,
  action: (client: AlphasmoClient) => Promise<T>,
  renderTable: (data: T) => string,
): Promise<void> {
  try {
    const client = buildClient(opts);
    const data = await action(client);
    printResult(data, resolveFormat(opts), renderTable as (data: never) => string);
  } catch (error) {
    process.stderr.write(`${messageForError(error)}\n`);
    process.exitCode = exitCodeForError(error);
  }
}
