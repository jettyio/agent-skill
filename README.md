# Jetty Agent Skill for Claude Code

A comprehensive [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill for managing and running AI/ML workflows on the [Jetty](https://jetty.io) platform.

## What is this?

This is a **Claude Code skill** -- a reusable package of instructions, shell helpers, and workflow templates that enables Claude Code to interact with the Jetty platform on your behalf. Once installed, you can use the `/jetty` slash command inside Claude Code to:

- Create and manage workflow tasks
- Run workflows synchronously or asynchronously
- Monitor trajectories and execution logs
- Browse step templates
- Label and annotate trajectories
- Manage collections, datasets, and models

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- A Jetty account at [dock.jetty.io](https://dock.jetty.io)
- A Jetty API token (format: `mlc_xxxxxxxxxxxxx`)
- `jq` installed for JSON parsing (`brew install jq` on macOS, `apt install jq` on Linux)
- `curl` for API requests

## Installation

### Option 1: Copy into your project (recommended)

```bash
# Clone this repository
git clone https://github.com/jettyio/agent-skill.git

# Copy the skill into your project's .claude/skills/ directory
mkdir -p /path/to/your-project/.claude/skills/
cp -r agent-skill/skill /path/to/your-project/.claude/skills/jetty
```

### Option 2: Copy to your global Claude Code skills

```bash
# Clone this repository
git clone https://github.com/jettyio/agent-skill.git

# Copy to your global skills directory
mkdir -p ~/.claude/skills/
cp -r agent-skill/skill ~/.claude/skills/jetty
```

### Option 3: Quick install (one-liner)

```bash
mkdir -p ~/.claude/skills/ && \
  git clone https://github.com/jettyio/agent-skill.git /tmp/jetty-skill && \
  cp -r /tmp/jetty-skill/skill ~/.claude/skills/jetty && \
  rm -rf /tmp/jetty-skill
```

### Configure your API token

Add your Jetty API token to your project's `CLAUDE.md` file or set it as an environment variable:

**Option A: In CLAUDE.md (project-level)**
```markdown
I have a Jetty API token: mlc_your_token_here
```

**Option B: Environment variable**
```bash
# Add to ~/.bashrc or ~/.zshrc
export JETTY_API_TOKEN="mlc_your_token_here"
```

### Verify installation

Open Claude Code in your project and run:

```
/jetty list collections
```

If your token is valid and has collection access, you should see your collections listed.

## Usage

### Inside Claude Code

Use the `/jetty` slash command followed by natural language:

```
/jetty list collections
/jetty list tasks in my-project
/jetty run my-project/my-task with prompt="Hello, world!"
/jetty show the last trajectory for my-project/my-task
/jetty create a task called test-echo in my-project using text_echo
/jetty add label quality=high to trajectory abc123 in my-project/my-task
```

### Shell Functions (standalone CLI)

You can also source the shell helper script for direct terminal usage:

```bash
# Source the helper functions
source ~/.claude/skills/jetty/jetty-cli.sh

# Check connectivity
jetty_health

# List resources
jetty_collections
jetty_tasks my-project

# Run a workflow
jetty_run_sync my-project my-task '{"prompt": "Hello"}'

# Monitor execution
jetty_trajectories my-project my-task
jetty_last_output my-project my-task

# Browse available activities
jetty_templates
jetty_search_templates "chat"
```

Run `jetty_help` for the full list of available commands.

## Repository Structure

```
agent-skill/
  skill/                  # The skill package (copy this to .claude/skills/jetty)
    SKILL.md              # Skill definition with YAML frontmatter (Claude Code reads this)
    README.md             # Internal skill documentation
    jetty-cli.sh          # Shell helper functions for terminal use
    templates/            # Ready-to-use workflow JSON files
      simple-chat.json
      quick-chat.json
      text-echo.json
      model-comparison.json
      text-evaluation.json
      batch-processor.json
      document-summarizer.json
      image-generation.json
    examples/             # Complete workflow examples with descriptions
      simple-chat.json
      document-qa.json
      fan-out-analysis.json
  docs/
    api-reference.md      # Complete Jetty API reference
    workflow-guide.md     # Guide to building Jetty workflows
    gotchas.md            # Known gotchas and workarounds
  README.md               # This file
  LICENSE                 # MIT License
```

## Jetty Platform Overview

Jetty is a platform for running AI/ML workflows. It provides two main APIs:

| Service | Base URL | Purpose |
|---------|----------|---------|
| **Flows API** | `https://flows-api.jetty.io` | Run workflows, view logs, trajectories |
| **Dock API** | `https://dock.jetty.io` | Manage collections, tasks, datasets, models |

### Key concepts

- **Collection**: A namespace grouping related tasks, datasets, and models
- **Task**: A named workflow definition containing steps
- **Workflow**: A JSON document with `init_params`, `step_configs`, and `steps`
- **Trajectory**: A record of a single workflow execution
- **Step Template (Activity)**: A reusable operation like `litellm_chat`, `text_echo`, or `simple_judge`
- **Labels**: Key-value annotations on trajectories for categorization and filtering
- **Path Expressions**: JSONPath-like references (e.g., `init_params.prompt`, `step1.outputs.text`) for dynamic data flow between steps

## Workflow Templates

The skill includes ready-to-use workflow templates:

| Template | Description |
|----------|-------------|
| `simple-chat.json` | LLM chat with system prompt and temperature control |
| `quick-chat.json` | Minimal single-step chat |
| `text-echo.json` | Simple echo for testing |
| `model-comparison.json` | Compare two LLM responses with an AI judge |
| `text-evaluation.json` | Score and categorize text using LLM-as-judge |
| `batch-processor.json` | Fan-out parallel item processing |
| `document-summarizer.json` | Configurable document summarization |
| `image-generation.json` | Image generation with Replicate |

### Using templates

```bash
# Create a task from a template
jetty_create_task my-project my-chat templates/simple-chat.json "My chat task"

# Run it
jetty_run_sync my-project my-chat '{"prompt": "Explain REST APIs"}'
```

Or inside Claude Code:
```
/jetty create a task called my-chat in my-project using the simple-chat template
```

## Getting Your API Token

1. Log in to [dock.jetty.io](https://dock.jetty.io)
2. Navigate to **Settings** -> **API Tokens**
3. Click **Create Token**
4. Copy the token (format: `mlc_xxxxxxxxxxxxx`)

API keys are scoped to specific collections. Ensure your token has access to the collections you want to work with.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid or expired token" | Regenerate your token at dock.jetty.io -> Settings -> API Tokens |
| "Access denied to collection" | Verify the collection name and that your token has access |
| "jq: command not found" | Install jq: `brew install jq` (macOS) or `apt install jq` (Linux) |
| Workflow fails silently | Check logs: `jetty_logs <workflow_id>`, review the trajectory details |
| `/jetty` command not found | Ensure the skill is in `.claude/skills/jetty/` and `SKILL.md` exists |
| `simple_judge` not working | Use `item`/`items` (not `content`), `instruction` (not `criteria`). See [gotchas](docs/gotchas.md) |

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Commit your changes: `git commit -m "Add my improvement"`
4. Push: `git push origin feature/my-improvement`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
