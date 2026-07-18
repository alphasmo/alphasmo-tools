import type { Command } from "commander";
import { type GlobalOptions, runAction } from "../run.js";
import { renderConvergence } from "../table.js";

export function registerConvergenceCommand(program: Command): void {
  program
    .command("convergence")
    .description("The flagship signal: tickers where both 13F institutions and insiders are buying")
    .option("-l, --limit <n>", "max results (1-50)", "20")
    .option("--min-confidence <n>", "minimum confidence score (0-100)", "60")
    .option("--days <n>", "lookback window in days", "90")
    .action(async (opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(
        globalOpts,
        (client) =>
          client.getSmartMoneyConvergence({
            limit: Number(opts.limit),
            minConfidence: Number(opts.minConfidence),
            days: Number(opts.days),
          }),
        renderConvergence,
      );
    });
}
