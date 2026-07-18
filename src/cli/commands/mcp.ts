import type { Command } from "commander";
import { runMcpServer } from "../../mcp/server.js";

export function registerMcpCommand(program: Command): void {
  program
    .command("mcp")
    .description("Start the AlphaSMO MCP server over stdio")
    .action(async () => {
      await runMcpServer();
    });
}
