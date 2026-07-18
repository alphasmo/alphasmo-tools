import type { Command } from "commander";
import { type GlobalOptions, runAction } from "../run.js";
import { renderHoldings, renderInstitutionDetail, renderInstitutionList } from "../table.js";

export function registerInstitutionsCommand(program: Command): void {
  const institutions = program
    .command("institutions")
    .description("13F institutional investors — search, profile, and holdings");

  institutions
    .command("search <query>")
    .description('Search 13F institutions by name, e.g. alphasmo institutions search "Berkshire"')
    .option("-l, --limit <n>", "max results", "10")
    .action(async (query: string, opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(
        globalOpts,
        (client) => client.listInstitutions({ q: query, limit: Number(opts.limit) }),
        renderInstitutionList,
      );
    });

  institutions
    .command("list")
    .description("List 13F institutions (no search query — paginate the full universe)")
    .option("-l, --limit <n>", "max results", "50")
    .option("-o, --offset <n>", "pagination offset", "0")
    .action(async (opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(
        globalOpts,
        (client) =>
          client.listInstitutions({ limit: Number(opts.limit), offset: Number(opts.offset) }),
        renderInstitutionList,
      );
    });

  institutions
    .command("get <slug>")
    .description("Get one institution's profile (AUM, personality scores, top sectors)")
    .action(async (slug: string, _opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(globalOpts, (client) => client.getInstitution(slug), renderInstitutionDetail);
    });

  institutions
    .command("holdings <slug>")
    .description("Get one institution's latest 13F stock holdings")
    .action(async (slug: string, _opts, command: Command) => {
      const globalOpts = command.optsWithGlobals<GlobalOptions>();
      await runAction(globalOpts, (client) => client.getInstitutionHoldings(slug), renderHoldings);
    });
}
