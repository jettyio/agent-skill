# PRD: Jetty Runbooks

## What is a Runbook?

A **runbook** is a structured markdown document that tells a coding agent (Claude Code, Cursor, Codex, etc.) how to accomplish a complex, multi-step task end-to-end. It is the bridge between a simple skill (a single-turn instruction set) and a fully autonomous agent pipeline.

A skill says *"here's how to call the Jetty API."*
A runbook says *"here's how to pull failed queries from Langfuse, replay them against our NL-to-SQL system, execute the results on Snowflake, evaluate whether they pass, and produce a regression report — and here's how to know when you're done."*

### Runbooks vs. Skills vs. Workflows

| | Skill | Workflow | Runbook |
|---|---|---|---|
| **Format** | Markdown (`SKILL.md`) | JSON (step configs) | Markdown (`RUNBOOK.md`) |
| **Executed by** | Coding agent (Claude Code) | Jetty engine | Coding agent, calling workflows/APIs |
| **Complexity** | Single tool or short procedure | Fixed DAG of step templates | Multi-phase process with judgment |
| **Iteration** | None — one-shot | None — runs to completion | Built-in: judge → refine → re-judge |
| **Adaptability** | Agent interprets loosely | Deterministic | Agent adapts within guardrails |
| **Output** | Varies | Trajectory (structured) | Defined file manifest + summary |
| **Use case** | "How to call this API" | "Run this pipeline" | "Accomplish this outcome" |

A skill can *become* a runbook when the task requires iteration, evaluation, and structured output. A runbook often *calls* workflows (or raw APIs) as sub-steps within its larger process.

---

## Core Properties of a Runbook

### 1. Outcome-oriented, not procedure-rigid

A runbook defines **what must be true when done** — not just what steps to execute. The agent has latitude in *how* it accomplishes intermediate steps, but the final deliverables and quality bar are non-negotiable.

This is the key distinction from a workflow (which is a fixed DAG) or a shell script (which is a fixed sequence). The agent is expected to reason, adapt, and recover.

### 2. Iterative with evaluation loops

Every runbook contains at least one **judge → refine → re-judge** cycle. The agent produces output, evaluates it against a rubric or validation check, and iterates if it falls short. This is the mechanism that makes runbooks reliable — the agent hill-climbs toward the quality bar rather than hoping the first attempt is correct.

Iteration is always bounded (typically 3 rounds max) to prevent infinite loops, and the runbook specifies what to do when the ceiling is reached ("keep best attempt," "flag for human review," etc.).

### 3. Defined output manifest

Every runbook declares upfront exactly which files must exist and be non-empty when the task is complete. This serves as both a contract and a self-check — the agent can verify its own completeness before stopping.

### 4. Parameterized

Runbooks use template variables (`{{param}}`) so the same runbook can be reused across different inputs, tenants, configurations, or environments. Parameters have defaults and documented constraints.

### 5. Self-verifying

Every runbook ends with a verification step — typically a script that checks all output files exist, are non-empty, and meet structural requirements. The agent must not declare completion until verification passes.

### 6. Versioned

Every runbook carries a version number in its frontmatter. When deployed as a Jetty task, the version tracks which iteration of the runbook is in use. Bump the version when evaluation criteria change, new steps are added, or the output manifest changes.

---

## Runbook Structure (Canonical)

The following sections appear in every well-formed runbook, in this order:

### Frontmatter

```markdown
---
version: "1.0.0"
evaluation: programmatic | rubric
---
```

Every runbook starts with YAML frontmatter declaring:

- **`version`** — Semantic version of the runbook. Bump on structural changes.
- **`evaluation`** — The evaluation pattern used. Two supported patterns:
  - `programmatic` — output is validated against a schema, API, or test suite (objective pass/fail)
  - `rubric` — output is scored against a multi-criteria rubric (numeric threshold)

### Header Block

```markdown
# {Task Name} — Agent Runbook

## Objective

{2-5 sentence description of the end-to-end task. Describes the pipeline
at a high level: input → processing stages → output.}
```

The objective is the agent's north star. It should be readable in 10 seconds and answer: *what am I doing, what am I producing, and for whom?*

### Output Manifest

```markdown
## REQUIRED OUTPUT FILES (MANDATORY)

**You MUST write all of the following files to `{{results_dir}}`.
The task is NOT complete until every file exists and is non-empty. No exceptions.**

| File | Description |
|------|-------------|
| `{{results_dir}}/{primary_output}` | The main deliverable |
| `{{results_dir}}/summary.md` | Executive summary |
| `{{results_dir}}/validation_report.json` | Structured validation results |
```

This section is intentionally aggressive in tone ("MANDATORY", "No exceptions") because agents tend to stop early when they encounter errors. The output manifest is the forcing function that prevents partial completion.

Every runbook produces a `validation_report.json` as its machine-readable results file. This is the standardized filename — do not use `scores.json`, `results.json`, or other variants. The schema of `validation_report.json` varies by runbook but always includes:

```json
{
  "version": "1.0.0",
  "run_date": "2026-03-26T...",
  "parameters": { },
  "stages": [
    { "name": "...", "passed": true, "message": "..." }
  ],
  "results": { },
  "overall_passed": true
}
```

### Parameters

```markdown
## Parameters

| Parameter | Template Variable | Default | Description |
|-----------|------------------|---------|-------------|
| Results directory | `{{results_dir}}` | `/app/results` (Jetty) / `./results` (local) | Output directory for all results |
| ... | `{{var_name}}` | ... | ... |
```

Parameters define what varies between runs. They are injected by the caller (Jetty `init_params`, environment variables, or the human operator). Every parameter should have a sensible default so the runbook can run with minimal configuration.

**Results directory convention:** `{{results_dir}}` defaults to `/app/results` when running on Jetty (the sandbox convention) and `./results` when running locally.

### Secrets

Secrets declare sensitive parameters that should never appear in `init_params`, trajectories, or parameter files. They resolve from environment variables locally and collection environment variables on Jetty.

```yaml
---
secrets:
  LANGFUSE_SECRET_KEY:
    env: LANGFUSE_SECRET_KEY
    description: "Langfuse API secret key"
    required: true
  OPENAI_API_KEY:
    env: OPENAI_API_KEY
    description: "OpenAI API key for embeddings"
    required: false
---
```

#### Conventions

- Keys are logical names referenced in the runbook as `{{secrets.LANGFUSE_SECRET_KEY}}`
- `env` is the environment variable name — the collection env var on Jetty, the OS env var locally
- The `{{secrets.*}}` prefix distinguishes secrets from regular `{{params}}`, enabling linting and preventing accidental logging

#### Local Resolution Order

1. **OS environment variable** matching the `env` field
2. **`.env` file** in the runbook directory (standard dotenv format, already `.gitignore`d)
3. **Interactive prompt** — if unresolved and `required: true`, ask the user once

Secrets are never written to `params.json`.

#### Jetty Resolution

On Jetty, secrets resolve from **collection environment variables** at runtime. Steps access them via `$ENV_VAR` in bash or the `env.*` path namespace in step configs:

```json
{
  "step_configs": {
    "my_step": {
      "activity": "litellm_chat",
      "api_key_path": "env.OPENAI_API_KEY"
    }
  }
}
```

For ad-hoc runs, the API accepts `secret_params` alongside `init_params`. These are merged into the runtime environment but never stored in trajectories.

#### Deploy Preflight

When deploying a runbook with `--jetty` mode:
1. Parse `secrets` from frontmatter
2. Check the target collection's configured environment variables
3. Prompt to set any missing required secrets
4. Package only non-secret params as `init_params`

### Dependencies

```markdown
## Dependencies

| Dependency | Type | Required | Description |
|------------|------|----------|-------------|
| `collection/workflow-name` | Jetty workflow | Yes | {What it does} |
| `https://api.example.com` | External API | Yes | {What it provides} |
| `LANGFUSE_SECRET_KEY` | Credential | Yes | {Auth for what} |
| `LANGFUSE_SECRET_KEY` | Secret (env var) | Yes | Auth for Langfuse — set via collection env vars |
| `pandas` | Python package | Yes | {Used for what} |
```

The dependencies section declares everything the runbook needs beyond the base agent environment:

- **Jetty workflows** the runbook calls (collection/task format)
- **External APIs** with their base URLs
- **Credentials** required (environment variables or parameters)
- **Packages** that the setup step will install

This makes runbooks portable — a new user can scan the dependencies to understand what they need before running.

### Setup Step

```markdown
## Step 1: Environment Setup

{Install dependencies, create directories, verify inputs exist.}
```

The setup step is idempotent — running it twice should not break anything. It ensures the environment is ready before the agent begins substantive work. This typically includes:

- Installing packages (`pip install`, `npm install`)
- Creating output directories (`mkdir -p`)
- Verifying input files exist
- Downloading assets if needed

### Processing Steps (variable count)

```markdown
## Step N: {Action Name}

{What to do, why, and how. Includes:}
- API call examples (curl/code snippets)
- Expected response formats
- Data extraction logic
- Error handling guidance
- What to record for the report
```

Processing steps are the substantive work. Each step should include:

1. **What** — the action to perform
2. **How** — concrete API calls, code snippets, or logic
3. **Expected output** — what a successful result looks like
4. **Error handling** — common failures and how to recover
5. **Recording** — what data to capture for downstream steps and the final report

Steps reference each other's outputs naturally ("For each query that produced valid SQL in Step 3..."). The agent maintains state across steps.

### Evaluation Step

The evaluation step is the heart of the iteration loop. It defines the quality bar and gives the agent clear criteria for self-assessment. The `evaluation` field in frontmatter determines which pattern to use.

#### For `evaluation: programmatic`

```markdown
## Step N: Evaluate Outputs

| Status | Criteria |
|--------|----------|
| `PASS` | {What qualifies as success} |
| `PARTIAL` | {What qualifies as partial success} |
| `FAIL` | {What qualifies as failure} |
```

Programmatic evaluation produces categorical outcomes (PASS/PARTIAL/FAIL/SQL_ERROR/etc.). Pass/fail is objective — a schema validates, SQL executes, tests pass. Error messages are specific and actionable, so iteration converges quickly (usually 1-2 rounds).

#### For `evaluation: rubric`

```markdown
## Step N: Evaluate Outputs

### Rubric

| # | Criterion | 5 (Excellent) | 3 (Acceptable) | 1 (Poor) |
|---|-----------|---------------|-----------------|----------|
| 1 | ... | ... | ... | ... |

**Pass threshold: >= 4.0 overall, no individual criterion below 3.**
```

Rubric evaluation produces numeric scores across multiple criteria. Quality is subjective — the agent is both producer and judge. Iteration targets the weakest criteria, guided by a "Common Fixes" table.

### Iteration Step

```markdown
## Step N: Iterate on Errors (max 3 rounds)

If {evaluation fails}:
1. Read the error/feedback
2. Make targeted fixes
3. Re-run evaluation
4. Repeat up to {max} times

### Common Fixes

| Issue | Fix |
|-------|-----|
| ... | ... |
```

The iteration step gives the agent a playbook for common failure modes. This is crucial — without it, the agent may thrash or give up. The "Common Fixes" table encodes domain expertise that accelerates convergence.

### Report / Summary Step

```markdown
## Step N: Write Executive Summary

Write `{{results_dir}}/summary.md` with the following structure:

{Markdown template with placeholders}
```

Every runbook produces a human-readable summary. The template is provided verbatim so the agent doesn't have to guess at the structure. Summaries typically include:

- Run metadata (date, parameters, counts)
- Results breakdown (pass/fail/partial by category)
- Sample outputs (successes and failures)
- Recommendations (what to fix, what to investigate)
- Limitations (what couldn't be evaluated)

### Structured Results Step

```markdown
## Step N: Write Validation Report

Write `{{results_dir}}/validation_report.json`:

{JSON template with expected structure}
```

The validation report is the machine-readable counterpart to the summary. It enables downstream automation — dashboards, CI checks, trend analysis. The filename is always `validation_report.json` regardless of the evaluation pattern.

### Final Checklist

```markdown
## Step N: Final Checklist (MANDATORY — do not skip)

### Verification Script

```bash
echo "=== FINAL OUTPUT VERIFICATION ==="
for f in ...; do
  if [ ! -s "$f" ]; then
    echo "FAIL: $f is missing or empty"
  else
    echo "PASS: $f ($(wc -c < "$f") bytes)"
  fi
done
```

### Checklist

- [ ] File A exists and meets structural requirements
- [ ] File B exists and follows the template
- [ ] File C exists with required fields
- [ ] Verification script printed PASS for all files

**If ANY item fails, go back and fix it. Do NOT finish until all items pass.**
```

The final checklist is the runbook's exit gate. It is both a script (for automated verification) and a prose checklist (for the agent to self-assess). The imperative language ("do NOT finish") is intentional — it overrides the agent's natural tendency to wrap up.

### Tips Section

```markdown
## Tips

- {Domain-specific gotcha}
- {API quirk to watch for}
- {Common mistake and how to avoid it}
```

Tips encode hard-won operational knowledge. They're things the runbook author learned from watching agents run (and fail). They belong at the end so they don't clutter the main flow, but the agent should read them before starting.

---

## Evaluation Patterns

Runbooks support two evaluation patterns. Declare the pattern in frontmatter (`evaluation: programmatic | rubric`).

### Pattern 1: Programmatic Validation (Data Pipelines)

Used by: `chordcommerce/RUNBOOK.md`, `pdf2mlcroissant/RUNBOOK.md`

The agent produces structured output, then validates it against a schema, API, or test suite. Iteration means "fix the error the validator reported."

```
Generate output → Validate (code/API) → Fix errors → Re-validate → ...
```

**Characteristics:**
- Pass/fail is objective (schema valid, SQL executes, tests pass)
- Error messages are specific and actionable
- Iteration converges quickly (usually 1-2 rounds)
- The agent fixes code/data, not prose

**Example:** Generate a Croissant JSON-LD file → validate with `mlcroissant` library → fix schema errors → re-validate (up to 3 rounds).

### Pattern 2: Rubric-Based Judgment (Generated Content)

Used by: `akinox-socials/RUNBOOK-with-image.md`, `kamyn/jetty/RUNBOOK.md`

The agent produces creative/complex output, then scores it against a multi-criteria rubric. Iteration means "improve the weakest criteria."

```
Generate output → Score against rubric → Identify weakest criteria → Targeted edits → Re-score → ...
```

**Characteristics:**
- Quality is subjective, assessed via rubric (1-5 scale)
- Pass threshold is defined (e.g., >= 4.0 overall, no criterion below 3)
- The agent is both producer and judge (self-evaluation)
- Iteration targets specific criteria rather than fixing errors
- A "Common Fixes" table maps criteria failures to concrete actions

**Example:** Generate a social graphic → score against 8 brand criteria → fix overlay opacity and font size → re-render and re-score (up to 3 rounds).

Rubric evaluation can also be delegated to a Jetty workflow with judge steps (as in the Akinox image generation step, where `judge_style` and `judge_quality` return yes/no verdicts with explanations). When using workflow-delegated judgment, the agent refines its inputs based on the judge's feedback and re-calls the workflow. This is still classified as `evaluation: rubric` — the delegation is an implementation detail of the evaluation step, not a separate pattern.

---

## How Runbooks Relate to Jetty

A runbook is a **consumer** of Jetty's platform capabilities:

### As an orchestration layer above workflows

The runbook tells the agent to call Jetty workflows as sub-steps. The workflow handles the deterministic pipeline (prompt → generate → judge), and the runbook handles the adaptive iteration (refine prompt based on judge feedback, try again, pick the best result).

```
┌─────────────────────────────────────────┐
│  Runbook (agent-interpreted)            │
│                                         │
│  Step 1: Setup                          │
│  Step 2: Call Jetty workflow ──────────►│──► Jetty Workflow (deterministic)
│  Step 3: Check results                  │      step 1 → step 2 → step 3
│  Step 4: If fail, refine & go to Step 2 │◄──── trajectory with outputs
│  Step 5: Report                         │
└─────────────────────────────────────────┘
```

### As a consumer of Jetty APIs

Runbooks that don't use Jetty workflows still use Jetty-adjacent APIs (Langfuse, Snowflake, HuggingFace). The runbook pattern is API-agnostic — it works with any external service the agent can call via HTTP.

### As a deployable unit on Jetty

A runbook + its parameters can be packaged as a Jetty task. When run via Jetty's agentic execution mode, the agent sandbox receives the runbook as its instruction set and the parameters as `init_params`. The output files land in the results directory for retrieval via the Jetty API.

Runbooks assume a **single-agent execution model** — one agent runs the entire runbook from start to finish. If a runbook calls a Jetty workflow that itself runs an agent internally, the runbook treats it as an opaque API call (poll for completion, read outputs). Nested agent orchestration is out of scope.

---

## Runbook Lifecycle

### Creation

1. A human builds a workflow or multi-step process manually
2. They observe the agent struggling with edge cases, iteration needs, or quality bars
3. They codify the process as a runbook — encoding the domain knowledge, evaluation criteria, and recovery strategies the agent needs

### From Skill to Runbook

A skill becomes a runbook when any of these are true:

- The task requires **iteration** (the first attempt is rarely sufficient)
- The task requires **evaluation** (there's a quality bar beyond "did it run?")
- The task produces **multiple artifacts** that must be consistent with each other
- The task involves **external API calls** that can fail in domain-specific ways
- The task benefits from **domain expertise** encoded as tips, common fixes, and rubrics

### Evolution

Runbooks evolve through use:

- **Tips accumulate** as agents encounter new failure modes
- **Common Fixes tables grow** as patterns emerge
- **Rubrics get refined** as the quality bar becomes clearer
- **Parameters get added** as new use cases arise
- **Evaluation criteria tighten** as the system matures
- **Version bumps** when structural changes affect output or evaluation

---

## Authoring Guidelines

### Do

- **Be specific about API calls.** Include full curl examples with expected request/response shapes. Agents struggle with underdocumented APIs.
- **Show the expected output structure.** JSON templates, CSV column lists, markdown skeletons — the agent should never have to guess at format.
- **Encode domain knowledge in Tips.** Things like "Langfuse auth is HTTP Basic, not Bearer" or "Snowflake function names differ from Spark" save the agent (and the user) significant debugging time.
- **Make evaluation criteria concrete.** "Good quality" is useless. "Score >= 4.0 on a 5-point rubric with 8 criteria, no criterion below 3" is actionable.
- **Bound iteration.** Always specify a max round count and what to do when it's reached.
- **Use imperative language for the output manifest and final checklist.** Agents are polite and will try to wrap up gracefully even when they haven't finished. "Do NOT finish until all items pass" overrides this.
- **List all dependencies.** Workflows, APIs, credentials, packages — make the runbook portable.
- **Use `validation_report.json`** as the standardized filename for machine-readable results.

### Don't

- **Don't over-specify intermediate steps.** The agent should have room to adapt. Specify *what* each step must produce, not every line of code.
- **Don't skip the verification script.** It's the only reliable way to ensure the agent actually produced all outputs.
- **Don't assume the agent remembers earlier steps.** Re-state key context when it's needed. Context windows are large but attention is finite.
- **Don't mix evaluation patterns.** Use programmatic validation for structured output and rubric-based judgment for creative output. Don't rubric-score a JSON file or schema-validate a social graphic.
- **Don't use `scores.json` or other filenames** for the machine-readable results — always `validation_report.json`.

---

## Tooling

### Runbook Runner (`run-runbook.sh`)

The jettyio-skills package includes a bash script for running runbooks locally or on Jetty. It reads a runbook's parameters from a JSON file, injects them as template variables, and invokes the agent.

```bash
# Run a runbook locally with default parameters
./run-runbook.sh path/to/RUNBOOK.md

# Run with parameter overrides from a JSON file
./run-runbook.sh path/to/RUNBOOK.md --params params.json

# Dry run — produce a plan without executing external API calls
./run-runbook.sh path/to/RUNBOOK.md --dry-run

# Run on Jetty (packages as task + init_params)
./run-runbook.sh path/to/RUNBOOK.md --params params.json --jetty
```

#### Parameter file format (`params.json`)

```json
{
  "results_dir": "./results",
  "sample_size": 10,
  "tenant_filter": "ritual",
  "langfuse_public_key": "pk-lf-...",
  "langfuse_secret_key": "sk-lf-..."
}
```

The runner:

1. Reads the runbook's `## Parameters` section to discover all `{{template_vars}}`
2. Loads the params JSON — every key maps to a `{{key}}` variable
3. Validates that all required parameters (those without defaults) are provided
4. In normal mode: passes the runbook + resolved parameters to the agent
5. In `--dry-run` mode: passes the runbook with a preamble instructing the agent to plan but not execute external calls, producing a `plan.md` instead of running the full pipeline
6. In `--jetty` mode: packages the runbook as a Jetty task's `init_params.runbook` and the parameters as additional `init_params`, then calls the Jetty run API

### Dry Run Mode

When invoked with `--dry-run`, the runner prepends a preamble to the runbook:

```
YOU ARE IN DRY-RUN MODE. Do NOT execute external API calls, workflow runs,
or write to external systems. Instead:

1. Read the full runbook
2. List all parameters and their resolved values
3. For each step, describe what you WOULD do (API calls, data transformations, etc.)
4. Identify potential issues (missing credentials, API dependencies, etc.)
5. Write {{results_dir}}/plan.md with your execution plan
```

This lets users review the agent's plan before committing to expensive API calls (image generation, Snowflake queries, LLM calls, etc.).

### Runbook Validator (`validate-runbook.sh`)

A script that checks a runbook for structural completeness without running it. Part of the jettyio-skills package.

```bash
./validate-runbook.sh path/to/RUNBOOK.md
```

**Checks performed:**

| Check | Severity | Description |
|-------|----------|-------------|
| Frontmatter present | Error | Must have `version` and `evaluation` fields |
| `evaluation` value valid | Error | Must be `programmatic` or `rubric` |
| `## Objective` present | Error | Header block required |
| `## REQUIRED OUTPUT FILES` present | Error | Output manifest required |
| `validation_report.json` in manifest | Error | Standardized results file required |
| `summary.md` in manifest | Warning | Recommended but not strictly required |
| `## Parameters` present | Warning | Required if runbook uses `{{template_vars}}` |
| All `{{vars}}` have entries in Parameters | Error | No undeclared template variables |
| `## Dependencies` present | Warning | Required if runbook calls external APIs/workflows |
| At least one evaluation step | Error | Must have status table or rubric |
| Iteration step with max rounds | Error | Must bound iteration |
| `## Final Checklist` present | Error | Exit gate required |
| Verification script present | Error | Must include bash verification |
| `## Tips` present | Warning | Recommended but not required |

**Output:**

```
=== RUNBOOK VALIDATION: path/to/RUNBOOK.md ===
PASS: Frontmatter (version: 1.0.0, evaluation: programmatic)
PASS: Objective section found
PASS: Output manifest found (3 files)
PASS: validation_report.json in manifest
PASS: Parameters section found (5 params)
PASS: All template variables declared
WARN: No Dependencies section — add if runbook uses external APIs
PASS: Evaluation step found (programmatic: 5 status categories)
PASS: Iteration step found (max 3 rounds)
PASS: Final checklist found
PASS: Verification script found
PASS: Tips section found

Result: VALID (1 warning)
```

---

## Template: Minimal Runbook

```markdown
---
version: "1.0.0"
evaluation: programmatic
---

# {Task Name} — Agent Runbook

## Objective

{What the agent is doing, end-to-end, in 2-5 sentences.}

---

## REQUIRED OUTPUT FILES (MANDATORY)

**You MUST write all of the following files to `{{results_dir}}`.
The task is NOT complete until every file exists and is non-empty. No exceptions.**

| File | Description |
|------|-------------|
| `{{results_dir}}/{primary_output}` | {What this is} |
| `{{results_dir}}/summary.md` | Executive summary |
| `{{results_dir}}/validation_report.json` | Structured validation results |

---

## Parameters

| Parameter | Template Variable | Default | Description |
|-----------|------------------|---------|-------------|
| Results directory | `{{results_dir}}` | `/app/results` (Jetty) / `./results` (local) | Output directory |
| ... | `{{var_name}}` | ... | ... |

---

## Dependencies

| Dependency | Type | Required | Description |
|------------|------|----------|-------------|
| ... | ... | ... | ... |

---

## Step 1: Environment Setup

{Install dependencies, create directories, verify inputs.}

---

## Step 2-N: {Processing Steps}

{The substantive work. Include API examples, expected responses, error handling.}

---

## Step N+1: Evaluate

{Define pass/fail criteria — either status-based or rubric-based.}

---

## Step N+2: Iterate (max 3 rounds)

{What to fix, how to fix it, when to stop.}

### Common Fixes

| Issue | Fix |
|-------|-----|
| ... | ... |

---

## Step N+3: Write Summary

{Markdown template for the executive summary.}

---

## Step N+4: Write Validation Report

{JSON template for structured results. Must include `version`, `stages`, `results`, `overall_passed`.}

---

## Step N+5: Final Checklist (MANDATORY — do not skip)

### Verification Script

```bash
echo "=== FINAL OUTPUT VERIFICATION ==="
RESULTS_DIR="{{results_dir}}"
for f in "$RESULTS_DIR/{file1}" "$RESULTS_DIR/{file2}" "$RESULTS_DIR/validation_report.json"; do
  if [ ! -s "$f" ]; then
    echo "FAIL: $f is missing or empty"
  else
    echo "PASS: $f ($(wc -c < "$f") bytes)"
  fi
done
```

### Checklist

- [ ] {File 1} exists and meets requirements
- [ ] {File 2} exists and follows template
- [ ] `validation_report.json` exists with `stages`, `results`, and `overall_passed`
- [ ] Verification script printed PASS for all files

**If ANY item fails, go back and fix it. Do NOT finish until all items pass.**

---

## Tips

- {Operational insight 1}
- {Operational insight 2}
```

---

## Decisions Log

Decisions made during PRD development, for context:

1. **Evaluation patterns**: Two supported — `programmatic` and `rubric`. External/workflow-delegated judges are an implementation detail within `rubric`, not a separate pattern.
2. **Dependencies section**: Required for any runbook that calls external APIs, workflows, or needs credentials.
3. **Runbook validator**: Part of the jettyio-skills package. Checks structural completeness without running the runbook.
4. **Single-agent scope**: Runbooks assume one agent runs the whole thing. Nested agent orchestration is out of scope.
5. **Versioning**: Semantic version in frontmatter. Sufficient for now — no platform-level version management.
6. **Results directory**: `{{results_dir}}` defaults to `/app/results` on Jetty, `./results` locally.
7. **Standardized results file**: Always `validation_report.json` — replaces any usage of `scores.json`.
8. **Dry-run mode**: Supported via `--dry-run` flag on the runner. Agent produces a plan instead of executing.
9. **Runner script**: `run-runbook.sh` reads a params JSON, injects template variables, supports local/Jetty/dry-run modes.
