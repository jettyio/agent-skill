# Jetty Workflow Guide

This guide covers how to build and run Jetty workflows.

## Workflow Structure

Every Jetty workflow is a JSON document with three sections:

```json
{
  "init_params": {
    "prompt": "Hello!",
    "model": "gpt-4o-mini"
  },
  "step_configs": {
    "chat": {
      "activity": "litellm_chat",
      "model_path": "init_params.model",
      "user_prompt_path": "init_params.prompt"
    }
  },
  "steps": ["chat"]
}
```

| Section | Purpose |
|---------|---------|
| `init_params` | Default input values. Callers can override these at runtime. |
| `step_configs` | One entry per step. Each entry must have an `activity` (the step template to use) plus activity-specific parameters. |
| `steps` | An ordered array of step names. Steps run in sequence. |

## Path Expressions

Path expressions let steps reference data from inputs or previous steps. Use the `_path` suffix on any parameter to make it dynamic:

```
init_params.prompt                # Runtime input parameter
step1.outputs.text                # Output from step1
step1.outputs.items[0].name       # Array index access
step1.outputs.items[*].id         # Wildcard: array of all ids
step1.inputs.prompt               # Input that was passed to step1
```

**Static vs dynamic parameters:**

```json
{
  "model": "gpt-4o-mini",
  "model_path": "init_params.model"
}
```

- `model` sets the value directly (static)
- `model_path` resolves the value from another step's data at runtime (dynamic)

If both are present, the `_path` version takes precedence.

## Common Activities

### litellm_chat

Universal LLM gateway supporting OpenAI, Anthropic, Google, and other providers.

```json
{
  "activity": "litellm_chat",
  "model": "gpt-4o-mini",
  "system_prompt": "You are a helpful assistant.",
  "user_prompt_path": "init_params.prompt",
  "temperature": 0.7
}
```

Key parameters:
- `model` / `model_path` - Model identifier (e.g., `gpt-4o`, `claude-3-5-sonnet-20241022`)
- `system_prompt` / `system_prompt_path` - System message
- `user_prompt` / `user_prompt_path` - User message
- `temperature` / `temperature_path` - Sampling temperature (0-2)
- `response_format` - Structured output schema

### text_echo

Pass-through step, useful for testing and debugging.

```json
{
  "activity": "text_echo",
  "text_path": "init_params.text"
}
```

### simple_judge

LLM-as-judge evaluation. Supports scale scoring and categorical classification.

```json
{
  "activity": "simple_judge",
  "items_path": "chat.outputs.text",
  "instruction": "Rate the quality of this response",
  "judge_type": "categorical",
  "categories": ["excellent", "good", "fair", "poor"],
  "with_explanation": true,
  "model": "gpt-4o"
}
```

Key parameters:
- `item` / `item_path` or `items` / `items_path` - Content to evaluate (**not** `content`)
- `instruction` / `instruction_path` - Evaluation criteria (**not** `criteria`)
- `judge_type` - `"scale"` or `"categorical"`
- `categories` - For categorical mode
- `scale_range` - For scale mode, e.g., `[1, 10]`
- `with_explanation` - Include reasoning
- `model` / `model_path` - Judge model

### list_emit_await (Fan-out)

Run a child workflow for each item in a list, in parallel.

```json
{
  "activity": "list_emit_await",
  "items_path": "split.outputs.chunks",
  "child_workflow_name": "my-collection/process-chunk",
  "item_param_name": "chunk",
  "max_concurrency": 10,
  "continue_on_error": true
}
```

### extract_from_trajectories (Fan-in)

Gather results from child trajectories created by `list_emit_await`.

```json
{
  "activity": "extract_from_trajectories",
  "trajectory_ids_path": "process_chunks.outputs.trajectory_ids",
  "extract_paths": ["summarize.outputs.text"]
}
```

### text_split

Split text into overlapping chunks.

```json
{
  "activity": "text_split",
  "text_path": "init_params.text",
  "chunk_size": 1000,
  "overlap": 100
}
```

### replicate_run

Run models on Replicate (image generation, etc.).

```json
{
  "activity": "replicate_run",
  "model": "black-forest-labs/flux-schnell",
  "input": {
    "prompt_path": "init_params.prompt",
    "aspect_ratio": "16:9"
  }
}
```

## Patterns

### Multi-step pipeline

```json
{
  "steps": ["generate", "evaluate", "summarize"]
}
```

Steps run in order. Each step can reference outputs from previous steps.

### Model comparison

Run the same prompt through multiple models, then judge which response is better:

```json
{
  "steps": ["model_a", "model_b", "compare"]
}
```

See `templates/model-comparison.json` for a complete example.

### Fan-out / Fan-in

Split work across parallel child workflows, then gather the results:

```json
{
  "steps": ["split", "parallel_process", "gather", "synthesize"]
}
```

See `templates/batch-processor.json` and `examples/fan-out-analysis.json`.

## Best Practices

1. **Start with `text_echo`** - Verify your workflow structure works before adding LLM calls
2. **Use `run-sync` for testing** - It blocks until completion, making debugging easier
3. **Use `run` (async) for production** - Better for long-running or parallel workflows
4. **Set sensible defaults** in `init_params` - Makes the workflow usable without overrides
5. **Use `_path` parameters** - Keeps workflows flexible and reusable
6. **Check trajectories** - Use `jetty_trajectories` and `jetty_trajectory` to debug issues
7. **Label trajectories** - Annotate runs with metadata for filtering and reporting
