import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer } from "../src/mcp/server.js";
import { institutionFixture, stockFixture } from "./fixtures.js";

const ORIGIN = "https://alphasmo.test";

let mockAgent: MockAgent;
let originalDispatcher: ReturnType<typeof getGlobalDispatcher>;
let originalEnv: { apiKey?: string; baseUrl?: string };

beforeEach(() => {
  mockAgent = new MockAgent();
  mockAgent.disableNetConnect();
  originalDispatcher = getGlobalDispatcher();
  setGlobalDispatcher(mockAgent);
  originalEnv = {
    apiKey: process.env.ALPHASMO_API_KEY,
    baseUrl: process.env.ALPHASMO_BASE_URL,
  };
  process.env.ALPHASMO_BASE_URL = `${ORIGIN}/api/v1`;
  process.env.ALPHASMO_API_KEY = undefined;
});

afterEach(async () => {
  setGlobalDispatcher(originalDispatcher);
  await mockAgent.close();
  if (originalEnv.apiKey === undefined) process.env.ALPHASMO_API_KEY = undefined;
  else process.env.ALPHASMO_API_KEY = originalEnv.apiKey;
  if (originalEnv.baseUrl === undefined) process.env.ALPHASMO_BASE_URL = undefined;
  else process.env.ALPHASMO_BASE_URL = originalEnv.baseUrl;
});

async function connectedClient(): Promise<Client> {
  const server = createMcpServer();
  const client = new Client({ name: "test-client", version: "1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(clientTransport), server.server.connect(serverTransport)]);
  return client;
}

describe("alphasmo MCP server", () => {
  it("registers all 7 tools", async () => {
    const client = await connectedClient();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "get_insider_activity",
        "get_institution_holdings",
        "get_institution_profile",
        "get_smart_money_convergence",
        "get_stock_flows",
        "get_stock_overview",
        "search_institutions",
      ].sort(),
    );
  });

  it("wraps list-returning tools' structuredContent as { result: [...] }", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply(200, [institutionFixture]);

    const client = await connectedClient();
    const result = await client.callTool({
      name: "search_institutions",
      arguments: { query: "Vanguard" },
    });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({ result: [institutionFixture] });
  });

  it("returns single-object tools' structuredContent directly (no wrapping)", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/market/stock/AAPL"), method: "GET" })
      .reply(200, stockFixture);

    const client = await connectedClient();
    const result = await client.callTool({
      name: "get_stock_overview",
      arguments: { identifier: "AAPL" },
    });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual(stockFixture);
  });

  it("surfaces backend errors as isError: true rather than throwing", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply(401);

    const client = await connectedClient();
    const result = await client.callTool({
      name: "search_institutions",
      arguments: { query: "Vanguard" },
    });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0]?.text).toContain("Invalid or revoked API key");
  });
});
