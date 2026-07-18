import { spawn } from "node:child_process";
import { type Server, createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { convergenceSignalFixture, institutionFixture } from "./fixtures.js";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const BIN_PATH = path.join(REPO_ROOT, "dist/cli/bin.js");

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/api/v1/institutions") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([institutionFixture]));
      return;
    }
    if (url.pathname === "/api/v1/institutions/does-not-exist") {
      res.writeHead(404);
      res.end();
      return;
    }
    if (url.pathname === "/api/v1/insider/smart-money-convergence") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([convergenceSignalFixture]));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("server address unknown");
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN_PATH, ...args], { stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));
  });
}

describe("alphasmo CLI", () => {
  it("exits 0 and prints compact JSON on success", async () => {
    const { stdout, stderr, code } = await runCli([
      "institutions",
      "list",
      "--base-url",
      baseUrl,
      "--format",
      "compact",
    ]);
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual([institutionFixture]);
  });

  it("defaults to JSON (not table) when stdout is not a TTY, with no --format flag", async () => {
    // spawn()'s stdio: "pipe" means the child's stdout is never a TTY, so this exercises the
    // same auto-detected path a script or AI agent spawning this CLI would get by default.
    const { stdout, stderr, code } = await runCli(["institutions", "list", "--base-url", baseUrl]);
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual([institutionFixture]);
  });

  it("--json is a shorthand for --format json", async () => {
    const { stdout, stderr, code } = await runCli([
      "institutions",
      "list",
      "--base-url",
      baseUrl,
      "--json",
    ]);
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual([institutionFixture]);
  });

  it("institutions search <query> takes the query as a positional argument", async () => {
    const { stdout, stderr, code } = await runCli([
      "institutions",
      "search",
      "Berkshire",
      "--base-url",
      baseUrl,
      "--format",
      "compact",
    ]);
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual([institutionFixture]);
  });

  it("exits 2 and prints a plain error to stderr on 404", async () => {
    const { stdout, stderr, code } = await runCli([
      "institutions",
      "get",
      "does-not-exist",
      "--base-url",
      baseUrl,
    ]);
    expect(code).toBe(2);
    expect(stdout).toBe("");
    expect(stderr).toContain("Not found");
  });

  it("renders --format table as a human-readable table", async () => {
    const { stdout, stderr, code } = await runCli([
      "convergence",
      "--base-url",
      baseUrl,
      "--format",
      "table",
    ]);
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(stdout).toContain("ticker");
    expect(stdout).toContain("AAPL");
  });
});
