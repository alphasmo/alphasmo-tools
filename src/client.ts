import type { z } from "zod";
import { AlphasmoParseError, raiseForStatus } from "./errors.js";
import {
  type ConvergenceSignal,
  ConvergenceSignalSchema,
  type Holding,
  HoldingSchema,
  type InsiderStock,
  InsiderStockSchema,
  type Institution,
  type InstitutionDetail,
  InstitutionDetailSchema,
  InstitutionSchema,
  type Stock,
  type StockFlow,
  StockFlowSchema,
  StockSchema,
} from "./schemas.js";
import { VERSION } from "./version.js";

export const DEFAULT_BASE_URL = "https://alphasmo.com/api/v1";
export const DEFAULT_TIMEOUT_MS = 10_000;

export interface AlphasmoClientOptions {
  /** API key sent as the X-API-Key header. Omit for the free anonymous (IP-limited) tier. */
  apiKey?: string;
  /** Base URL of the public API. Defaults to the production API. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 10000. */
  timeoutMs?: number;
  /** Injectable fetch implementation, used for testing. Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /**
   * Identifies which surface is making the request (e.g. "cli", "mcp") via the User-Agent
   * header, so request volume can be split out by client type on the server side later.
   * Defaults to "sdk" for direct programmatic use of this library.
   */
  clientName?: string;
}

function clean(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) out[key] = String(value);
  }
  return out;
}

function parse<S extends z.ZodTypeAny>(schema: S, data: unknown, url: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw new AlphasmoParseError(url, result.error);
  return result.data;
}

/**
 * HTTP client for the AlphaSMO public API. There is a single client class — unlike the Python
 * SDK's sync/async pair, `fetch` is inherently async, so that split collapses to one class here.
 * There is also no `.close()`/context-manager story: fetch has no persistent connection-pool
 * object to dispose of the way `httpx.Client` does.
 */
export class AlphasmoClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;

  constructor(options: AlphasmoClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetch ?? fetch;
    const clientName = options.clientName ?? "sdk";
    this.userAgent = `alphasmo-${clientName}/${VERSION} (Node.js ${process.version})`;
  }

  private async get(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(clean(params))) {
      url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = { "User-Agent": this.userAgent };
    if (this.apiKey) headers["X-API-Key"] = this.apiKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url.toString(), {
        headers,
        signal: controller.signal,
      });
      await raiseForStatus(response, url.toString());
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async listInstitutions(
    options: { q?: string; limit?: number; offset?: number } = {},
  ): Promise<Institution[]> {
    const path = "/institutions";
    const url = `${this.baseUrl}${path}`;
    const data = await this.get(path, {
      q: options.q,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
    return parse(InstitutionSchema.array(), data, url);
  }

  async getInstitution(slug: string): Promise<InstitutionDetail> {
    const path = `/institutions/${encodeURIComponent(slug)}`;
    const data = await this.get(path);
    return parse(InstitutionDetailSchema, data, `${this.baseUrl}${path}`);
  }

  async getInstitutionHoldings(slug: string): Promise<Holding[]> {
    const path = `/institutions/${encodeURIComponent(slug)}/holdings`;
    const data = await this.get(path);
    return parse(HoldingSchema.array(), data, `${this.baseUrl}${path}`);
  }

  async getStock(identifier: string): Promise<Stock> {
    const path = `/market/stock/${encodeURIComponent(identifier)}`;
    const data = await this.get(path);
    return parse(StockSchema, data, `${this.baseUrl}${path}`);
  }

  async getStockFlows(
    options: { direction?: "buy" | "sell"; limit?: number } = {},
  ): Promise<StockFlow[]> {
    const path = "/market/stock-flows";
    const data = await this.get(path, {
      direction: options.direction ?? "buy",
      limit: options.limit ?? 25,
    });
    return parse(StockFlowSchema.array(), data, `${this.baseUrl}${path}`);
  }

  async getInsiderStock(ticker: string): Promise<InsiderStock> {
    const path = `/insider/stock/${encodeURIComponent(ticker)}`;
    const data = await this.get(path);
    return parse(InsiderStockSchema, data, `${this.baseUrl}${path}`);
  }

  async getSmartMoneyConvergence(
    options: { limit?: number; minConfidence?: number; days?: number } = {},
  ): Promise<ConvergenceSignal[]> {
    const path = "/insider/smart-money-convergence";
    const data = await this.get(path, {
      limit: options.limit ?? 20,
      min_confidence: options.minConfidence ?? 60.0,
      days: options.days ?? 90,
    });
    return parse(ConvergenceSignalSchema.array(), data, `${this.baseUrl}${path}`);
  }
}
