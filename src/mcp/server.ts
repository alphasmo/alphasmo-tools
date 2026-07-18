import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AlphasmoClient, DEFAULT_BASE_URL } from "../client.js";
import {
  ConvergenceSignalSchema,
  HoldingSchema,
  InsiderStockSchema,
  InstitutionDetailSchema,
  InstitutionSchema,
  StockFlowSchema,
  StockSchema,
} from "../schemas.js";
import { VERSION } from "../version.js";

// A fresh client per tool call rather than one shared for the server's lifetime — MCP tool
// call volume doesn't warrant connection-pool reuse complexity (fetch has no pool to reuse
// anyway), and this avoids any risk of cross-call state assumptions. Matches the Python MCP
// server's stated rationale for the same choice.
function client(): AlphasmoClient {
  return new AlphasmoClient({
    apiKey: process.env.ALPHASMO_API_KEY,
    baseUrl: process.env.ALPHASMO_BASE_URL ?? DEFAULT_BASE_URL,
    clientName: "mcp",
  });
}

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

/** Single-object tool results are returned as-is in structuredContent. */
function objectResult(data: Record<string, unknown>): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data };
}

/**
 * List-returning tools wrap structuredContent as `{ result: [...] }` — MCP structured content
 * must be a JSON object, not a bare array. This exactly replicates the shape the Python
 * FastMCP-based server already produces for list-returning tools, so a client written against
 * either implementation's structured-content shape works unmodified against the other.
 */
function listResult(data: unknown[]): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ result: data }) }],
    structuredContent: { result: data },
  };
}

function errorResult(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

async function safely(fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (error) {
    return errorResult(error);
  }
}

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "alphasmo", version: VERSION });

  server.registerTool(
    "search_institutions",
    {
      description:
        'Search 13F institutional investors by name, e.g. "Berkshire" or "Bridgewater". ' +
        "Returns each match's slug (needed for get_institution_profile/" +
        "get_institution_holdings), AUM, and personality scores.",
      inputSchema: { query: z.string(), limit: z.number().int().default(10) },
      outputSchema: z.object({ result: z.array(InstitutionSchema) }),
    },
    async ({ query, limit }) =>
      safely(async () => {
        const results = await client().listInstitutions({ q: query, limit });
        return listResult(results);
      }),
  );

  server.registerTool(
    "get_institution_profile",
    {
      description:
        "Get one institution's profile: AUM, holding count, personality scores " +
        "(concentration, turnover, sector conviction, etc.), and top sector weights. Use " +
        "search_institutions first to find the slug.",
      inputSchema: { slug: z.string() },
      outputSchema: InstitutionDetailSchema,
    },
    async ({ slug }) =>
      safely(async () => {
        const result = await client().getInstitution(slug);
        return objectResult(result);
      }),
  );

  server.registerTool(
    "get_institution_holdings",
    {
      description:
        "Get one institution's latest 13F stock holdings — ticker, value, weight, and " +
        "buy/sell/hold action versus the prior quarter.",
      inputSchema: { slug: z.string() },
      outputSchema: z.object({ result: z.array(HoldingSchema) }),
    },
    async ({ slug }) =>
      safely(async () => {
        const results = await client().getInstitutionHoldings(slug);
        return listResult(results);
      }),
  );

  server.registerTool(
    "get_stock_overview",
    {
      description:
        "Get a stock's institutional-ownership overview: holder count, net institutional " +
        "flow, top holders by value and by conviction, ownership history. `identifier` can " +
        "be a ticker or 9-character CUSIP.",
      inputSchema: { identifier: z.string() },
      outputSchema: StockSchema,
    },
    async ({ identifier }) =>
      safely(async () => {
        const result = await client().getStock(identifier);
        return objectResult(result);
      }),
  );

  server.registerTool(
    "get_stock_flows",
    {
      description:
        "Get stocks ranked by net institutional buy or sell flow in the latest quarter. " +
        '`direction` is "buy" or "sell".',
      inputSchema: {
        direction: z.enum(["buy", "sell"]).default("buy"),
        limit: z.number().int().default(25),
      },
      outputSchema: z.object({ result: z.array(StockFlowSchema) }),
    },
    async ({ direction, limit }) =>
      safely(async () => {
        const results = await client().getStockFlows({ direction, limit });
        return listResult(results);
      }),
  );

  server.registerTool(
    "get_insider_activity",
    {
      description:
        "Get Form 4 insider (officer/director/10%-owner) trading activity and confidence " +
        "scores for a stock ticker, plus recent individual insider trades.",
      inputSchema: { ticker: z.string() },
      outputSchema: InsiderStockSchema,
    },
    async ({ ticker }) =>
      safely(async () => {
        const result = await client().getInsiderStock(ticker);
        return objectResult(result);
      }),
  );

  server.registerTool(
    "get_smart_money_convergence",
    {
      description:
        "The flagship signal: tickers where BOTH 13F institutions AND company insiders are " +
        "buying at the same time. Combines this API's two independent signal sources into " +
        "one — the strongest buy convergence this API can surface.",
      inputSchema: {
        limit: z.number().int().default(20),
        minConfidence: z.number().default(60.0),
      },
      outputSchema: z.object({ result: z.array(ConvergenceSignalSchema) }),
    },
    async ({ limit, minConfidence }) =>
      safely(async () => {
        const results = await client().getSmartMoneyConvergence({ limit, minConfidence });
        return listResult(results);
      }),
  );

  return server;
}

export async function runMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
