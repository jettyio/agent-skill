---
name: jetty
description: Manage Jetty workflows and assets. Use when the user wants to create/edit/run workflows, manage collections, tasks, datasets, or models on Jetty. Triggers include "run workflow", "create task", "list collections", "check trajectory", "label trajectory", "add label", "deploy workflow", or any Jetty/mise/dock operations.
argument-hint: [command] [args]
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch
---

# Jetty Workflow Management Skill

This skill enables you to interact with the Jetty platform to manage and run AI/ML workflows. Jetty provides two main APIs:

| Service | Base URL | Purpose |
|---------|----------|---------|
| **Flows API** | `https://flows-api.jetty.io` | Run workflows, view logs, trajectories |
| **Dock API** | `https://dock.jetty.io` | Manage collections, tasks, datasets, models |

---

## Quick Start

### 1. Authentication Setup

```bash
# Check if token is already set
if [ -z "$JETTY_API_TOKEN" ]; then
  echo "JETTY_API_TOKEN not set. Please provide your API token."
else
  echo "Token is configured: ${JETTY_API_TOKEN:0:10}..."
fi
```

All API requests require a Bearer token in the Authorization header:
```bash
curl -H "Authorization: Bearer $JETTY_API_TOKEN" ...
```

### 2. Collection Scope (Important!)

API keys are scoped to specific collections. Your token only works with collections it has access to.

```bash
# List your accessible collections first
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/collections/" | jq '.[].name'
```

### 3. Verify Setup

```bash
# Health check both APIs
curl -s "https://flows-api.jetty.io/api/v1/health" | jq
curl -s "https://dock.jetty.io/api/v1/health" | jq
```

---

## Core Operations Reference

### Collections

```bash
# List all collections
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/collections/" | jq

# Get collection details
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/collections/{COLLECTION}" | jq

# Create a collection
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/collections/" \
  -d '{"name": "my-collection", "description": "My workflows"}' | jq
```

### Tasks (Workflows)

```bash
# List tasks in a collection
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/tasks/{COLLECTION}/" | jq

# Get task details (includes workflow definition)
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/tasks/{COLLECTION}/{TASK}" | jq

# Search tasks
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/tasks/{COLLECTION}/search?q={QUERY}" | jq

# Create task
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/tasks/{COLLECTION}" \
  -d '{
    "name": "my-task",
    "description": "Task description",
    "workflow": {
      "init_params": {},
      "step_configs": {},
      "steps": []
    }
  }' | jq

# Update task
curl -s -X PUT -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/tasks/{COLLECTION}/{TASK}" \
  -d '{"workflow": {...}, "description": "Updated"}' | jq

# Delete task
curl -s -X DELETE -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/tasks/{COLLECTION}/{TASK}" | jq
```

### Run Workflows

```bash
# Run async (returns immediately with workflow_id)
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -F "bakery_host=https://dock.jetty.io" \
  -F 'init_params={"key": "value"}' \
  "https://flows-api.jetty.io/api/v1/run/{COLLECTION}/{TASK}" | jq

# Run sync (waits for completion)
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -F "bakery_host=https://dock.jetty.io" \
  -F 'init_params={"key": "value"}' \
  "https://flows-api.jetty.io/api/v1/run-sync/{COLLECTION}/{TASK}" | jq

# Run with file upload
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -F "bakery_host=https://dock.jetty.io" \
  -F 'init_params={"prompt": "Analyze this document"}' \
  -F "files=@/path/to/file.pdf" \
  "https://flows-api.jetty.io/api/v1/run/{COLLECTION}/{TASK}" | jq
```

### Monitor Workflows

```bash
# Get workflow logs
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/workflows-logs/{WORKFLOW_ID}" | jq

# List trajectories (execution history)
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectories/{COLLECTION}/{TASK}?limit=20" | jq

# Get trajectory details
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectory/{COLLECTION}/{TASK}/{TRAJECTORY_ID}" | jq

# Get workflow statistics
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/stats/{COLLECTION}/{TASK}" | jq
```

### Labels

Labels allow you to annotate trajectories with key-value metadata for categorization, tracking, and filtering.

```bash
# Add a label to a trajectory
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://flows-api.jetty.io/api/v1/trajectory/{COLLECTION}/{TASK}/{TRAJECTORY_ID}/labels" \
  -d '{
    "key": "review-status",
    "value": "approved",
    "author": "reviewer@example.com"
  }' | jq

# Common label examples
# Quality rating
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://flows-api.jetty.io/api/v1/trajectory/{COLLECTION}/{TASK}/{TRAJECTORY_ID}/labels" \
  -d '{"key": "quality", "value": "high", "author": "user@example.com"}' | jq

# Classification tag
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://flows-api.jetty.io/api/v1/trajectory/{COLLECTION}/{TASK}/{TRAJECTORY_ID}/labels" \
  -d '{"key": "category", "value": "production", "author": "user@example.com"}' | jq

# Feedback annotation
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://flows-api.jetty.io/api/v1/trajectory/{COLLECTION}/{TASK}/{TRAJECTORY_ID}/labels" \
  -d '{"key": "feedback", "value": "needs-improvement", "author": "user@example.com"}' | jq
```

| Field | Description | Required |
|-------|-------------|----------|
| `key` | Label identifier (e.g., "status", "quality", "category") | Yes |
| `value` | Label value (e.g., "approved", "high", "production") | Yes |
| `author` | Email of the person adding the label | Yes |

### Step Templates

```bash
# List all available step templates
curl -s "https://flows-api.jetty.io/api/v1/step-templates" | jq

# Get details for a specific activity
curl -s "https://flows-api.jetty.io/api/v1/step-templates/{ACTIVITY}" | jq
```

### Datasets

```bash
# List datasets
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/datasets/{COLLECTION}" | jq

# Get dataset details
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/datasets/{COLLECTION}/{DATASET}" | jq

# Create dataset
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/datasets/{COLLECTION}" \
  -d '{"name": "my-dataset", "description": "Dataset description"}' | jq
```

### Models

```bash
# List models
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/models/{COLLECTION}/" | jq

# Get model details
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://dock.jetty.io/api/v1/models/{COLLECTION}/{MODEL}" | jq
```

---

## Workflow Structure

A Jetty workflow is a JSON document with three main sections:

```json
{
  "init_params": {
    "param1": "default_value",
    "param2": 123
  },
  "step_configs": {
    "step_name": {
      "activity": "activity_name",
      "param1": "static_value",
      "param2_path": "init_params.param2"
    }
  },
  "steps": ["step_name"]
}
```

### Key Concepts

| Component | Description |
|-----------|-------------|
| `init_params` | Default input parameters for the workflow |
| `step_configs` | Configuration for each step, keyed by step name |
| `steps` | Ordered list of step names to execute |
| `activity` | The step template to use |
| `*_path` suffix | Dynamic reference to data from init_params or previous steps |

### Path Expressions

Reference data from different sources:

```
init_params.prompt              # Input parameter
step1.outputs.text              # Output from step1
step1.outputs.items[0].name     # Array index access
step1.outputs.items[*].id       # Wildcard (returns array of all ids)
step1.inputs.prompt             # Input that was passed to step1
```

---

## Common Step Templates

### AI Models

| Activity | Purpose | Key Parameters |
|----------|---------|----------------|
| `litellm_chat` | Universal LLM chat | `model`, `system_prompt`, `user_prompt`, `temperature` |
| `gemini_generate` | Google Gemini | `model`, `prompt`, `temperature` |
| `replicate_run` | Replicate models | `model`, `input` |
| `vision_model` | Image analysis | `model`, `image_path`, `prompt` |

### Control Flow

| Activity | Purpose | Key Parameters |
|----------|---------|----------------|
| `list_emit_await` | Fan-out parallel execution | `items_path`, `child_workflow_name`, `max_concurrency` |
| `extract_from_trajectories` | Fan-in gather results | `trajectory_ids_path`, `extract_paths` |
| `conditional_step` | Conditional branching | `condition_path`, `true_step`, `false_step` |

### Data Processing

| Activity | Purpose | Key Parameters |
|----------|---------|----------------|
| `text_echo` | Pass through text | `text` or `text_path` |
| `text_split` | Split text into chunks | `text_path`, `chunk_size`, `overlap` |
| `json_transform` | Transform JSON | `input_path`, `jmespath_query` |

### Evaluation

| Activity | Purpose | Key Parameters |
|----------|---------|----------------|
| `simple_judge` | LLM-as-judge evaluation | `items`, `instruction`, `judge_type`, `model` |

---

## Workflow Templates

### Template 1: Simple LLM Chat

```json
{
  "init_params": {
    "prompt": "Hello, how are you?",
    "model": "gpt-4o-mini"
  },
  "step_configs": {
    "chat": {
      "activity": "litellm_chat",
      "model_path": "init_params.model",
      "system_prompt": "You are a helpful assistant.",
      "user_prompt_path": "init_params.prompt",
      "temperature": 0.7
    }
  },
  "steps": ["chat"]
}
```

### Template 2: Text Echo (Testing)

```json
{
  "init_params": {
    "text": "Hello, Jetty!"
  },
  "step_configs": {
    "echo": {
      "activity": "text_echo",
      "text_path": "init_params.text"
    }
  },
  "steps": ["echo"]
}
```

### Template 3: Model Comparison

```json
{
  "init_params": {
    "prompt": "Explain quantum computing in simple terms",
    "models": ["gpt-4o", "claude-3-sonnet-20240229"]
  },
  "step_configs": {
    "model_a": {
      "activity": "litellm_chat",
      "model": "gpt-4o",
      "user_prompt_path": "init_params.prompt",
      "temperature": 0.7
    },
    "model_b": {
      "activity": "litellm_chat",
      "model": "claude-3-sonnet-20240229",
      "user_prompt_path": "init_params.prompt",
      "temperature": 0.7
    },
    "compare": {
      "activity": "simple_judge",
      "items": ["model_a.outputs.text", "model_b.outputs.text"],
      "instruction": "Compare these responses for clarity and accuracy",
      "judge_type": "categorical",
      "categories": ["first_better", "second_better", "tie"],
      "with_explanation": true,
      "model": "gpt-4o"
    }
  },
  "steps": ["model_a", "model_b", "compare"]
}
```

### Template 4: Fan-Out Processing

```json
{
  "init_params": {
    "text": "Long document text here...",
    "chunk_size": 1000
  },
  "step_configs": {
    "split": {
      "activity": "text_split",
      "text_path": "init_params.text",
      "chunk_size_path": "init_params.chunk_size",
      "overlap": 100
    },
    "process_chunks": {
      "activity": "list_emit_await",
      "items_path": "split.outputs.chunks",
      "child_workflow_name": "{COLLECTION}/process-chunk",
      "item_param_name": "chunk",
      "max_concurrency": 10
    },
    "gather": {
      "activity": "extract_from_trajectories",
      "trajectory_ids_path": "process_chunks.outputs.trajectory_ids",
      "extract_paths": ["summarize.outputs.text"]
    }
  },
  "steps": ["split", "process_chunks", "gather"]
}
```

### Template 5: Image Generation

```json
{
  "init_params": {
    "prompt": "A serene mountain landscape at sunset"
  },
  "step_configs": {
    "generate": {
      "activity": "replicate_run",
      "model": "black-forest-labs/flux-schnell",
      "input": {
        "prompt_path": "init_params.prompt",
        "num_outputs": 1,
        "aspect_ratio": "16:9"
      }
    }
  },
  "steps": ["generate"]
}
```

---

## Common Workflows

### Workflow: Create and Test a Task

```bash
# 1. Create the task
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/tasks/{COLLECTION}" \
  -d '{
    "name": "test-echo",
    "description": "Simple echo test",
    "workflow": {
      "init_params": {"text": "Hello!"},
      "step_configs": {
        "echo": {"activity": "text_echo", "text_path": "init_params.text"}
      },
      "steps": ["echo"]
    }
  }' | jq

# 2. Run it synchronously
curl -s -X POST -H "Authorization: Bearer $JETTY_API_TOKEN" \
  -F "bakery_host=https://dock.jetty.io" \
  -F 'init_params={"text": "Test message"}' \
  "https://flows-api.jetty.io/api/v1/run-sync/{COLLECTION}/test-echo" | jq

# 3. Check the result in trajectory
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectories/{COLLECTION}/test-echo?limit=1" | jq
```

### Workflow: Debug a Failed Run

```bash
# 1. Get recent trajectories
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectories/{COLLECTION}/{TASK}?limit=5" | jq

# 2. Get trajectory details (find the failed one)
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectory/{COLLECTION}/{TASK}/{TRAJECTORY_ID}" | jq

# 3. Check workflow logs
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/workflows-logs/{WORKFLOW_ID}" | jq

# 4. Examine the step that failed
curl -s -H "Authorization: Bearer $JETTY_API_TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectory/{COLLECTION}/{TASK}/{TRAJECTORY_ID}" \
  | jq '.steps[] | select(.status == "failed")'
```

### Workflow: List Available Activities

```bash
# Get all step templates with their parameters
curl -s "https://flows-api.jetty.io/api/v1/step-templates" | jq '.[] | {name: .name, description: .description}'

# Get details for a specific activity
curl -s "https://flows-api.jetty.io/api/v1/step-templates/litellm_chat" | jq
```

---

## Error Handling

| Status | Meaning | Resolution |
|--------|---------|------------|
| 401 | Invalid/expired token | Regenerate token at dock.jetty.io → Settings → API Tokens |
| 403 | Access denied | Verify token has access to the collection |
| 404 | Not found | Check collection/task names for typos |
| 422 | Validation error | Check request body format and required fields |
| 429 | Rate limited | Reduce request frequency, implement backoff |
| 500 | Server error | Retry with exponential backoff |

---

## Best Practices

### Workflow Design

1. **Start simple** - Test with `text_echo` before adding complexity
2. **Use path expressions** - Reference data dynamically instead of hardcoding
3. **Set reasonable defaults** - Provide sensible `init_params` defaults
4. **Add descriptions** - Document what your task does

### Execution

1. **Use sync for testing** - `run-sync` is easier to debug
2. **Use async for production** - Better for long-running workflows
3. **Check trajectories** - Review execution history for issues
4. **Monitor statistics** - Use stats endpoint to track performance

### API Usage

1. **Always use jq** - Format responses for readability
2. **Quote JSON properly** - Escape special characters in curl
3. **Set token in environment** - Avoid exposing tokens in commands
4. **Handle errors** - Check response status codes

---

## Tips

- Use `jq -r '.field'` to extract specific fields without quotes
- Use `jq '.[0]'` to get the first item from an array
- Use `jq 'keys'` to see available fields in a response
- Pipe to `jq -C` for colored output
- Use `curl -v` for debugging request/response issues
- Set `JETTY_API_TOKEN` in your shell profile (`~/.bashrc` or `~/.zshrc`)
