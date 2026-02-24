# Jetty Plugin for Claude Code

Build, run, and monitor AI/ML workflows on [Jetty](https://jetty.io) — from prompt to production in 5 minutes.

## Quick Start

```bash
# Install the plugin
claude plugin add github:jettyio/jetty-plugin

# Run the setup wizard
/jetty-setup
```

The setup wizard will:
1. Open your browser to create a Jetty account (or use an existing one)
2. Configure your API key
3. Let you choose OpenAI or Gemini for image generation
4. Deploy and run a demo workflow — the **Cute Feline Detector** (prompt → image → AI judge)
5. Download the results to your machine

## What's Inside

### `/jetty-setup` — First-time Setup
Guided onboarding that gets you from zero to running your first workflow. Handles account creation, API key configuration, provider selection (BYOK), and a demo run.

### `/jetty` — Full Workflow Management
The main skill for day-to-day Jetty operations:

```
/jetty list collections
/jetty list tasks in my-project
/jetty run my-project/my-task with prompt="Hello, world!"
/jetty show the last trajectory for my-project/my-task
/jetty create a task called test-echo in my-project using text_echo
/jetty add label quality=high to trajectory abc123 in my-project/my-task
```

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- `jq` (`brew install jq` on macOS, `apt install jq` on Linux)
- `curl`
- An OpenAI or Google Gemini API key (for image generation workflows)

## Workflow Templates

Ready-to-use workflow templates are included:

| Template | Description |
|----------|-------------|
| **cute-feline-detector-openai** | Prompt → DALL-E 3 image → GPT-4o cuteness judge |
| **cute-feline-detector-gemini** | Prompt → Gemini image → Gemini Flash cuteness judge |
| simple-chat | Basic LLM chat with system prompt |
| model-comparison | Compare two LLM responses with an AI judge |
| image-generation | Text-to-image with Replicate/FLUX |
| text-evaluation | Score and categorize text with LLM-as-judge |
| batch-processor | Fan-out parallel processing |
| document-summarizer | Configurable document summarization |

## Alternative Installation

### From source (development)

```bash
git clone https://github.com/jettyio/jetty-plugin.git
claude --plugin-dir ./jetty-plugin
```

### Manual copy

```bash
git clone https://github.com/jettyio/jetty-plugin.git /tmp/jetty-plugin
cp -r /tmp/jetty-plugin ~/.claude/plugins/jetty
```

## Shell Functions (standalone CLI)

For direct terminal usage without Claude Code:

```bash
export JETTY_API_TOKEN="mlc_your_token_here"
source path/to/skills/jetty/jetty-cli.sh

jetty_health                                    # Check connectivity
jetty_collections                               # List collections
jetty_run_sync my-project my-task '{"prompt": "Hello"}'  # Run a workflow
jetty_trajectories my-project my-task           # View execution history
jetty_help                                      # Full command reference
```

## How It Works

Jetty runs AI/ML workflows defined as JSON pipelines. Each workflow has:
- **init_params** — Input parameters (e.g., a prompt)
- **step_configs** — Pipeline steps (e.g., LLM call → image generation → judge)
- **steps** — Execution order

Example — the Cute Feline Detector:
```
User prompt → Expand to vivid description → Generate cat image → Judge cuteness (1-5)
```

Results are stored as **trajectories** with full step-by-step outputs, downloadable files, and labeling support.

## Platform Overview

| Service | URL | Purpose |
|---------|-----|---------|
| Flows API | `flows-api.jetty.io` | Run workflows, trajectories, files |
| Dock API | `dock.jetty.io` | Collections, tasks, datasets |
| Web UI | `flows.jetty.io` | Dashboard and management |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid or expired token" | Regenerate at flows.jetty.io → Settings → API Tokens |
| "Access denied" | Verify your token has access to the collection |
| `jq` not found | `brew install jq` (macOS) or `apt install jq` (Linux) |
| `/jetty-setup` not found | Reinstall: `claude plugin add github:jettyio/jetty-plugin` |
| Workflow fails | Use `/jetty show logs for <workflow_id>` to debug |

## Other AI Tools (Cursor, Gemini CLI, Codex, etc.)

Jetty also ships an MCP server that works with **any** MCP-compatible AI tool — no `jq` or `curl` required.

```bash
npx -y jetty-mcp-server
```

See [docs/integrations.md](docs/integrations.md) for configuration snippets for Cursor, Gemini CLI, Codex CLI, and more.

## Documentation

- [AI Tool Integrations](docs/integrations.md)
- [API Reference](docs/api-reference.md)
- [Workflow Building Guide](docs/workflow-guide.md)
- [Known Gotchas](docs/gotchas.md)

## License

MIT License — see [LICENSE](LICENSE) for details.
