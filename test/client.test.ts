import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AlphasmoClient } from "../src/client.js";
import { AlphasmoAuthError, AlphasmoNotFoundError, AlphasmoRateLimitError } from "../src/errors.js";
import { convergenceSignalFixture, institutionFixture } from "./fixtures.js";

const ORIGIN = "https://alphasmo.test";
const BASE_URL = `${ORIGIN}/api/v1`;

let mockAgent: MockAgent;
let originalDispatcher: ReturnType<typeof getGlobalDispatcher>;

beforeEach(() => {
  mockAgent = new MockAgent();
  mockAgent.disableNetConnect();
  originalDispatcher = getGlobalDispatcher();
  setGlobalDispatcher(mockAgent);
});

afterEach(async () => {
  setGlobalDispatcher(originalDispatcher);
  await mockAgent.close();
});

describe("AlphasmoClient", () => {
  it("parses list_institutions response", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply(200, [institutionFixture]);

    const client = new AlphasmoClient({ baseUrl: BASE_URL });
    const result = await client.listInstitutions();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("VANGUARD GROUP INC");
  });

  it("attaches the X-API-Key header when a key is provided", async () => {
    let seenHeader: string | undefined;
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply((req) => {
        seenHeader = (req.headers as Record<string, string>)["X-API-Key"];
        return { statusCode: 200, data: JSON.stringify([]) };
      });

    const client = new AlphasmoClient({ apiKey: "ask_live_test", baseUrl: BASE_URL });
    await client.listInstitutions();
    expect(seenHeader).toBe("ask_live_test");
  });

  it("tags the User-Agent header with clientName so cli vs mcp traffic can be split later", async () => {
    let seenUA: string | undefined;
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply((req) => {
        seenUA = (req.headers as Record<string, string>)["User-Agent"];
        return { statusCode: 200, data: JSON.stringify([]) };
      });

    const client = new AlphasmoClient({ baseUrl: BASE_URL, clientName: "mcp" });
    await client.listInstitutions();
    expect(seenUA).toMatch(/^alphasmo-mcp\/\d+\.\d+\.\d+ \(Node\.js /);
  });

  it("defaults clientName to sdk for direct programmatic use", async () => {
    let seenUA: string | undefined;
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply((req) => {
        seenUA = (req.headers as Record<string, string>)["User-Agent"];
        return { statusCode: 200, data: JSON.stringify([]) };
      });

    const client = new AlphasmoClient({ baseUrl: BASE_URL });
    await client.listInstitutions();
    expect(seenUA).toMatch(/^alphasmo-sdk\//);
  });

  it("omits the X-API-Key header when no key is provided", async () => {
    let hadHeader = true;
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply((req) => {
        hadHeader = "X-API-Key" in (req.headers as Record<string, string>);
        return { statusCode: 200, data: JSON.stringify([]) };
      });

    const client = new AlphasmoClient({ baseUrl: BASE_URL });
    await client.listInstitutions();
    expect(hadHeader).toBe(false);
  });

  it("omits undefined query params from the request URL", async () => {
    let seenSearch = "";
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply((req) => {
        seenSearch = new URL(req.path, ORIGIN).search;
        return { statusCode: 200, data: JSON.stringify([]) };
      });

    const client = new AlphasmoClient({ baseUrl: BASE_URL });
    await client.listInstitutions({ q: undefined });
    expect(seenSearch).not.toContain("q=");
  });

  it("raises AlphasmoNotFoundError on 404", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({ path: "/api/v1/institutions/nonexistent", method: "GET" })
      .reply(404);

    const client = new AlphasmoClient({ baseUrl: BASE_URL });
    await expect(client.getInstitution("nonexistent")).rejects.toThrow(AlphasmoNotFoundError);
  });

  it("raises AlphasmoAuthError on 401", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply(401);

    const client = new AlphasmoClient({ apiKey: "bad-key", baseUrl: BASE_URL });
    await expect(client.listInstitutions()).rejects.toThrow(AlphasmoAuthError);
  });

  it("raises AlphasmoRateLimitError on 429", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({ path: (p) => p.startsWith("/api/v1/institutions"), method: "GET" })
      .reply(429);

    const client = new AlphasmoClient({ baseUrl: BASE_URL });
    await expect(client.listInstitutions()).rejects.toThrow(AlphasmoRateLimitError);
  });

  it("parses smart-money-convergence response", async () => {
    mockAgent
      .get(ORIGIN)
      .intercept({
        path: (p) => p.startsWith("/api/v1/insider/smart-money-convergence"),
        method: "GET",
      })
      .reply(200, [convergenceSignalFixture]);

    const client = new AlphasmoClient({ baseUrl: BASE_URL });
    const result = await client.getSmartMoneyConvergence();
    expect(result).toHaveLength(1);
    expect(result[0]?.ticker).toBe("AAPL");
    expect(result[0]?.cluster_alert).toBe(true);
  });
});
