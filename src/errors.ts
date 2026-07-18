/** Base class for all errors raised by this client. */
export class AlphasmoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlphasmoError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The requested institution/stock/ticker doesn't exist in alphasmo's tracked universe. */
export class AlphasmoNotFoundError extends AlphasmoError {
  constructor(url: string) {
    super(`Not found: ${url}`);
    this.name = "AlphasmoNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The provided API key is invalid or has been revoked. */
export class AlphasmoAuthError extends AlphasmoError {
  constructor() {
    super("Invalid or revoked API key.");
    this.name = "AlphasmoAuthError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Rate limit exceeded. Anonymous requests are limited by IP; pass an apiKey to raise the
 * limit — see https://alphasmo.com/en/developer to create one.
 */
export class AlphasmoRateLimitError extends AlphasmoError {
  constructor() {
    super(
      "Rate limit exceeded. Anonymous requests are limited by IP; pass an apiKey to raise the " +
        "limit — see https://alphasmo.com/en/developer to create one.",
    );
    this.name = "AlphasmoRateLimitError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * The API returned a response that doesn't match this client's expected shape. This is a
 * TypeScript-only addition (the Python client lets pydantic ValidationError propagate as-is) —
 * it exists to give CLI/MCP users an actionable message instead of a raw ZodError if the
 * backend's response shape ever drifts from this client's schemas.
 */
export class AlphasmoParseError extends AlphasmoError {
  constructor(url: string, cause: unknown) {
    super(`Unexpected response shape from ${url}: ${String(cause)}`);
    this.name = "AlphasmoParseError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Any other non-2xx response not covered by the specific error classes above. */
export class AlphasmoHttpError extends AlphasmoError {
  readonly status: number;

  constructor(status: number, statusText: string, url: string, body: string) {
    super(`Request to ${url} failed with ${status} ${statusText}: ${body}`);
    this.name = "AlphasmoHttpError";
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export async function raiseForStatus(response: Response, url: string): Promise<void> {
  if (response.ok) return;
  if (response.status === 404) throw new AlphasmoNotFoundError(url);
  if (response.status === 401) throw new AlphasmoAuthError();
  if (response.status === 429) throw new AlphasmoRateLimitError();
  const body = await response.text().catch(() => "");
  throw new AlphasmoHttpError(response.status, response.statusText, url, body);
}
