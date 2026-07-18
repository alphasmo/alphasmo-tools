import { Command, Option } from "commander";
import { VERSION } from "../version.js";
import { registerConvergenceCommand } from "./commands/convergence.js";
import { registerInsiderCommand } from "./commands/insider.js";
import { registerInstitutionsCommand } from "./commands/institutions.js";
import { registerMcpCommand } from "./commands/mcp.js";
import { registerStocksCommand } from "./commands/stocks.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("alphasmo")
    .description(
      [
        "AlphaSMO: The Ultimate Smart Money API for AI.",
        "13F institutional holdings, insider trading, and smart-money convergence signals",
        "from your terminal.",
        "",
        "  * Free anonymous tier by IP (no signup required).",
        "  * Pass --api-key or set ALPHASMO_API_KEY to raise your rate limit.",
        "  * Developer docs: https://alphasmo.com/en/developer",
      ].join("\n"),
    )
    .version(VERSION)
    .option("--api-key <key>", "API key (env: ALPHASMO_API_KEY)")
    .option("--base-url <url>", "base URL of the public API (env: ALPHASMO_BASE_URL)")
    .addOption(
      new Option(
        "-f, --format <format>",
        "output format (default: table in a terminal, json when piped/scripted)",
      ).choices(["json", "compact", "table", "csv"]),
    )
    .option("--json", "shorthand for --format json")
    .option("--csv", "shorthand for --format csv");

  registerInstitutionsCommand(program);
  registerStocksCommand(program);
  registerInsiderCommand(program);
  registerConvergenceCommand(program);
  registerMcpCommand(program);

  return program;
}
