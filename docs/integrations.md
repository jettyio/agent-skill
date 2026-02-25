# Jetty — AI Tool Integrations

Jetty's MCP server works with any tool that supports the [Model Context Protocol](https://modelcontextprotocol.io). Below are configuration snippets for popular AI coding tools.

## Prerequisites

- Node.js 18+
- A Jetty API token — get one at [flows.jetty.io](https://flows.jetty.io) → Settings → API Tokens

## Claude Code

### Plugin (recommended)

```bash
claude plugin add github:jettyio/agent-skill
```

This gives you the MCP tools plus `/jetty-setup` (guided onboarding) and `/jetty` (natural language workflow management).

### MCP server only

```bash
claude mcp add jetty -- npx -y jetty-mcp-server
```

Or add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "jetty": {
      "command": "npx",
      "args": ["-y", "jetty-mcp-server"],
      "env": { "JETTY_API_TOKEN": "mlc_your_token" }
    }
  }
}
```

## Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "jetty": {
      "command": "npx",
      "args": ["-y", "jetty-mcp-server"],
      "env": { "JETTY_API_TOKEN": "mlc_your_token" }
    }
  }
}
```

## VS Code Copilot

Add to `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "jetty": {
      "command": "npx",
      "args": ["-y", "jetty-mcp-server"],
      "env": { "JETTY_API_TOKEN": "mlc_your_token" }
    }
  }
}
```

Or run `MCP: Add Server` from the Command Palette and select "stdio", then enter `npx -y jetty-mcp-server`.

## Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "jetty": {
      "command": "npx",
      "args": ["-y", "jetty-mcp-server"],
      "env": { "JETTY_API_TOKEN": "mlc_your_token" }
    }
  }
}
```

Or install from the MCP Marketplace via Windsurf Settings (⌘,).

## Zed

Add to your Zed settings (`~/.config/zed/settings.json`):

```json
{
  "context_servers": {
    "jetty": {
      "command": {
        "path": "npx",
        "args": ["-y", "jetty-mcp-server"],
        "env": { "JETTY_API_TOKEN": "mlc_your_token" }
      }
    }
  }
}
```

Verify the server is running via the Agent Panel — the indicator dot should be green.

## Gemini CLI

```bash
gemini extensions install gemini-extension.json
```

The `gemini-extension.json` file is included in the repo root. Set `JETTY_API_TOKEN` in your environment before running Gemini CLI.

## Codex CLI

Add to `~/.codex/config.json`:

```json
{
  "mcpServers": {
    "jetty": {
      "command": "npx",
      "args": ["-y", "jetty-mcp-server"],
      "env": { "JETTY_API_TOKEN": "mlc_your_token" }
    }
  }
}
```

Or pass directly:

```bash
codex --mcp-server "npx -y jetty-mcp-server"
```

## Generic MCP Client

Any MCP-compatible tool can use Jetty. Run the server with:

```bash
JETTY_API_TOKEN=mlc_your_token npx -y jetty-mcp-server
```

The server communicates over stdio using the MCP protocol.

## Available Tools

Once connected, these tools are available:

| Tool | Description |
|------|-------------|
| `list-collections` | List all collections |
| `get-collection` | Get collection details + env var keys |
| `list-tasks` | List tasks in a collection |
| `get-task` | Get task details + workflow definition |
| `create-task` | Create a task with a workflow |
| `update-task` | Update a task's workflow or description |
| `run-workflow` | Run a workflow asynchronously |
| `run-workflow-sync` | Run a workflow synchronously |
| `list-trajectories` | List recent workflow runs |
| `get-trajectory` | Get full run details |
| `get-stats` | Get execution statistics |
| `add-label` | Label a trajectory |
| `list-step-templates` | List available step templates |
| `get-step-template` | Get template details and schema |

## Registry Submissions

The MCP server can be submitted to these registries (requires the npm package to be published first):

- [Smithery](https://smithery.ai) — `smithery.yaml` included in repo root
- [mcp.so](https://mcp.so)
- [Glama](https://glama.ai)
