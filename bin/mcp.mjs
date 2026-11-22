// guessit-js MCP server on stdio: lets AI agents (Claude, Cursor, VS Code, any MCP
// client) call guessit as a tool. Newline-delimited JSON-RPC 2.0 on stdin/stdout.
//
//   npx -y guessit-js --mcp
//
// stdout carries protocol messages only; anything else goes to stderr.

import { createInterface } from 'node:readline';
import { handleMcpPayload } from './mcp-core.mjs';

/** In-process there is no HTTP request to bound, only a sanity cap. */
const STDIO_MAX_BATCH = 1000;

/**
 * Run the MCP server on stdin/stdout until stdin closes.
 * @param {{ guessit: Function, guessitMany: Function, properties: Function, version: string }} api
 */
export function runMcpServer(api, { input = process.stdin, output = process.stdout } = {}) {
  const surface = { maxBatch: STDIO_MAX_BATCH, ...api };
  const rl = createInterface({ input, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    const answer = handleMcpPayload(surface, line);
    if (answer) output.write(JSON.stringify(answer) + '\n');
  });
  return rl;
}
