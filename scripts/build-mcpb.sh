#!/usr/bin/env bash
# Build the Claude Desktop extension bundle (MCPB) from the built library:
#   npm run build && bash scripts/build-mcpb.sh   ->  mcpb/guessit-js.mcpb
# The bundle runs `node bin/cli.mjs --mcp` locally; zero dependencies, so it
# holds only the bundled library, the CLI and the MCP server files.
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(node -p "require('./package.json').version")
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/bin" "$stage/dist"
cp dist/guessit-js.js "$stage/dist/"
cp bin/cli.mjs bin/mcp.mjs bin/mcp-core.mjs "$stage/bin/"
cp LICENSE "$stage/"
# dist/guessit-js.js is an ES module; cli.mjs reads the version from the library.
printf '{\n  "name": "guessit-js",\n  "version": "%s",\n  "type": "module",\n  "private": true\n}\n' "$version" > "$stage/package.json"
node -e '
  const fs = require("fs");
  const m = JSON.parse(fs.readFileSync("mcpb/manifest.json", "utf8"));
  m.version = process.argv[1];
  fs.writeFileSync(process.argv[2] + "/manifest.json", JSON.stringify(m, null, 2) + "\n");
' "$version" "$stage"
npx -y @anthropic-ai/mcpb@2.1.2 validate "$stage/manifest.json"
npx -y @anthropic-ai/mcpb@2.1.2 pack "$stage" mcpb/guessit-js.mcpb
