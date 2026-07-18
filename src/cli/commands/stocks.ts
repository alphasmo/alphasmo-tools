import { type Command, Option } from "commander";
import { type GlobalOptions, runAction } from "../run.js";
import { renderStock, renderStockFlows } from "../table.js";

export function registerStocksCommand(program: Command): void {
  const stocks = program
    .command("stocks")
    .description("Stock-level institutional ownership and flows");

  stocks
    .command("get <identifier>")
    .description("Get a stock's institutional ownership overview (identifier = ticker or CUSIP)")
    .action(async (identifier: string, _opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(globalOpts, (client) => client.getStock(identifier), renderStock);
    });

  stocks
    .command("flows")
    .description("Stocks ranked by net institutional buy/sell flow in the latest quarter")
    .addOption(
      new Option("-d, --direction <direction>", "buy or sell")
        .choices(["buy", "sell"])
        .default("buy"),
    )
    .option("-l, --limit <n>", "max results", "25")
    .action(async (opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(
        globalOpts,
        (client) =>
          client.getStockFlows({
            direction: opts.direction as "buy" | "sell",
            limit: Number(opts.limit),
          }),
        renderStockFlows,
      );
    });
}
