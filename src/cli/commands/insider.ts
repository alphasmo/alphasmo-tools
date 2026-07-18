import type { Command } from "commander";
import { type GlobalOptions, runAction } from "../run.js";
import { renderInsiderSummary, renderInsiderTrades } from "../table.js";

// A resource group, not a single verb — matches institutions/stocks. Both subcommands below
// call the same GET /insider/stock/{ticker} endpoint (the only one this API exposes today) and
// just slice its response two different ways; there's no second HTTP call involved. Grouping
// under "insider" like this (rather than a flat `alphasmo insider <ticker>`) leaves room to add
// sibling subcommands backed by future endpoints (e.g. a market-wide screener, Form 144 intent-
// to-sell filings) without colliding with a ticker positional argument.
export function registerInsiderCommand(program: Command): void {
  const insider = program
    .command("insider")
    .description("Form 4 insider (officer/director/10%-owner) trading activity");

  insider
    .command("trades <ticker>")
    .description("Recent individual insider trades for a ticker")
    .action(async (ticker: string, _opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(
        globalOpts,
        async (client) => {
          const stock = await client.getInsiderStock(ticker);
          return {
            ticker: stock.ticker,
            issuer_name: stock.issuer_name,
            data_as_of: stock.data_as_of,
            recent_trades: stock.recent_trades,
          };
        },
        renderInsiderTrades,
        (data) => data.recent_trades,
      );
    });

  insider
    .command("summary <ticker>")
    .description("Insider confidence scores (30d/90d) for a ticker")
    .action(async (ticker: string, _opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(
        globalOpts,
        async (client) => {
          const stock = await client.getInsiderStock(ticker);
          return {
            ticker: stock.ticker,
            issuer_name: stock.issuer_name,
            data_as_of: stock.data_as_of,
            score_30d: stock.score_30d,
            score_90d: stock.score_90d,
          };
        },
        renderInsiderSummary,
      );
    });
}
