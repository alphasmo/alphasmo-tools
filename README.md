# AlphaSMO — The Ultimate Smart Money API for AI

[![npm version](https://img.shields.io/npm/v/alphasmo.svg)](https://www.npmjs.com/package/alphasmo)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**CLI + [MCP server](https://modelcontextprotocol.io) for [AlphaSMO](https://alphasmo.com)** — SEC EDGAR 13F institutional holdings, Form 4 insider trading, and "smart money convergence" signals (tickers where hedge funds *and* company insiders are buying at the same time), queryable from your terminal, your scripts, or any MCP-compatible AI agent (Claude, ChatGPT, Cursor, etc.).

No signup, no API key, no setup — try it right now:

```bash
npx alphasmo convergence
```

## Why AlphaSMO

- 📊 **13F institutional holdings** — every hedge fund and asset manager's quarterly SEC filings: AUM, positions, and behavioral "personality scores" (concentration, turnover, sector conviction).
- 🕵️ **Insider trading (Form 4)** — officer/director/10%-owner buys and sells, with a confidence score per ticker.
- 🚀 **Smart money convergence** — the flagship signal: tickers where 13F institutions *and* company insiders are both buying right now.
- 🤖 **Built for AI agents** — an MCP server out of the box, so Claude, ChatGPT, Cursor, or any MCP client can pull real financial data mid-conversation.
- 🆓 **Free anonymous tier** — no signup required to try it; [get a free API key](https://alphasmo.com/en/developer) any time to raise your rate limit.

## Use cases

```
"What is smart money buying right now?"        → alphasmo convergence
"What does Berkshire Hathaway hold?"            → alphasmo institutions holdings berkshire-hathaway-inc
"Are insiders buying or selling NVDA?"          → alphasmo insider summary NVDA
"Which stocks are institutions dumping?"        → alphasmo stocks flows --direction sell
```

Wire the MCP server into Claude Desktop, Claude Code, Cursor, or any MCP client (see [below](#mcp-server)) and ask these in plain English — no code required.

## CLI

```bash
npx alphasmo institutions search "Berkshire"
npx alphasmo stocks get AAPL
npx alphasmo convergence -l 5
```

No install step required — `npx` fetches and runs it. Or install globally:

```bash
npm install -g alphasmo
alphasmo --help
```

### Commands

| Command | What it returns |
|---|---|
| `alphasmo institutions search <query> [-l\|--limit]` | Search 13F institutions by name |
| `alphasmo institutions list [-l\|--limit] [-o\|--offset]` | Paginate the full institution universe (no query) |
| `alphasmo institutions get <slug>` | Full institution detail, sector weights |
| `alphasmo institutions holdings <slug>` | Latest 13F holdings for one institution |
| `alphasmo stocks get <identifier>` | Full stock detail — holder count, flows, top holders (identifier = ticker or CUSIP) |
| `alphasmo stocks flows [-d\|--direction buy\|sell] [-l\|--limit]` | Stocks ranked by net institutional buy/sell flow |
| `alphasmo insider trades <ticker>` | Recent individual Form 4 insider trades for one ticker |
| `alphasmo insider summary <ticker>` | Insider confidence scores (30d/90d) for one ticker |
| `alphasmo convergence [-l\|--limit] [--min-confidence] [--days]` | Tickers where 13F institutions *and* insiders are both buying — the flagship signal |
| `alphasmo mcp` | Start the MCP server over stdio |

Global flags on every command: `--api-key <key>` (env `ALPHASMO_API_KEY`), `--base-url <url>` (env `ALPHASMO_BASE_URL`), `-f`/`--format json|compact|table`, `--json` (shorthand for `--format json`).

**Output format auto-detects your context** — no flag needed in the common case:
- Typed directly in a terminal → a readable table, with numbers comma-formatted (`263,095,703,570`).
- Piped, redirected, or spawned by a script/AI agent (stdout isn't a TTY) → JSON, safe to pipe into `jq` or feed to an agent.
- `--format`/`--json` always override the auto-detection either way.

Errors go to stderr with a distinct exit code (`2` not found, `3` auth, `4` rate limit, `5` unexpected response shape, `1` other), so scripts can branch without string-matching.

## Get an API key

Anonymous requests are rate-limited by IP. Sign up and mint a free key at **[alphasmo.com/en/developer](https://alphasmo.com/en/developer)**, then:

```bash
alphasmo convergence --api-key ask_live_...
# or
export ALPHASMO_API_KEY=ask_live_...
```

## MCP server

Add this to your MCP client config (Claude Desktop, Claude Code, Cursor, etc.):

```json
{
  "mcpServers": {
    "alphasmo": {
      "command": "npx",
      "args": ["alphasmo", "mcp"],
      "env": { "ALPHASMO_API_KEY": "optional-your-key-here" }
    }
  }
}
```

Works anonymously out of the box, at lower rate limits than with a key. Tools exposed: `search_institutions`, `get_institution_profile`, `get_institution_holdings`, `get_stock_overview`, `get_stock_flows`, `get_insider_activity`, `get_smart_money_convergence`.

Full endpoint reference: [alphasmo.com/en/developer/docs](https://alphasmo.com/en/developer/docs).

## Programmatic use

```ts
import { AlphasmoClient } from "alphasmo";

const client = new AlphasmoClient(); // no apiKey needed to try it
console.log(await client.getSmartMoneyConvergence({ limit: 5 }));
```

```bash
npm install alphasmo
```

A Python client + MCP server is also available — see [alphasmo.com/en/developer](https://alphasmo.com/en/developer) for setup.

## Learn more

- **[alphasmo.com](https://alphasmo.com)** — the full web app: institution profiles, stock screeners, insider-trading leaderboards
- **[alphasmo.com/en/developer](https://alphasmo.com/en/developer)** — get a free API key
- **[alphasmo.com/en/developer/docs](https://alphasmo.com/en/developer/docs)** — full public API reference

## License

MIT
