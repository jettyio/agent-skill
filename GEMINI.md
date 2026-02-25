# Jetty — AI/ML Workflows

You have access to Jetty MCP tools for building, running, and monitoring AI/ML workflows. Use these tools when the user asks about workflows, collections, tasks, trajectories, or anything related to Jetty.

## Available Tools

| Tool | Description |
|------|-------------|
| `list-collections` | List all collections (workspaces) |
| `get-collection` | Get collection details and environment variable keys |
| `list-tasks` | List tasks (workflows) in a collection |
| `get-task` | Get task details and workflow definition |
| `create-task` | Create a new task with a workflow |
| `update-task` | Update a task's workflow or description |
| `run-workflow` | Run a workflow asynchronously |
| `run-workflow-sync` | Run a workflow synchronously (blocks until done) |
| `list-trajectories` | List recent workflow runs |
| `get-trajectory` | Get full run details with step outputs |
| `get-stats` | Get execution statistics |
| `add-label` | Label a trajectory (e.g., quality=high) |
| `list-step-templates` | List available step templates |
| `get-step-template` | Get template details and schema |

## Quick Start

When a user wants to get started with Jetty:

1. Use `list-collections` to see their workspaces
2. Use `list-tasks` to see available workflows
3. Use `run-workflow` or `run-workflow-sync` to execute a workflow
4. Use `get-trajectory` to inspect results

## Workflow Structure

Workflows are JSON pipelines with three sections:
- **init_params** — Input parameters (e.g., a prompt)
- **step_configs** — Pipeline steps (e.g., LLM call, image generation, judge)
- **steps** — Execution order

## Key Gotchas

- `litellm_chat`: use `prompt`/`prompt_path` (NOT `user_prompt`)
- `replicate_text2image` outputs: `.outputs.images[0].path`
- `simple_judge`: use `item`/`item_path` (NOT `content`), `instruction` (NOT `criteria`)
- Trajectory list responses wrap the array: access via `.trajectories[]`
- Steps in a trajectory are an object keyed by step name, not an array

## Getting Help

- Platform docs: https://jetty.io
- Sign up: https://flows.jetty.io/sign-up
- API tokens: flows.jetty.io → Settings → API Tokens
