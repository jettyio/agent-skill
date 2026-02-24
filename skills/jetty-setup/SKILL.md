---
name: jetty-setup
description: Set up Jetty for the first time. Guides the user through account creation, API key configuration, provider selection (OpenAI or Gemini), and runs a demo "Cute Feline Detector" workflow. Use when the user says "set up jetty", "configure jetty", "jetty setup", "get started with jetty", or "install jetty".
argument-hint:
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, AskUserQuestion
---

# Jetty Setup Wizard

You are guiding a user through first-time Jetty setup. The goal is to get them from zero to running their first AI workflow in under 5 minutes. Follow these steps IN ORDER. Be friendly and concise.

---

## Step 1: Check for Existing Token

First, check if a Jetty API token already exists:

1. Read the project's `CLAUDE.md` file (if it exists) and look for a token starting with `mlc_`
2. If found, validate it:

```bash
TOKEN="mlc_THE_TOKEN_YOU_FOUND"
curl -s -H "Authorization: Bearer $TOKEN" "https://dock.jetty.io/api/v1/collections/" | head -c 200
```

If the response contains collection data (not an error), the token is valid. Tell the user:
> "Found a valid Jetty token in your project. You're already connected!"

Then use AskUserQuestion:
- Header: "Setup"
- Question: "You already have a Jetty token configured. What would you like to do?"
- Options:
  - "Run the demo workflow" / "Deploy and run the Cute Feline Detector"
  - "Reconfigure" / "Start fresh with a new token or provider"
  - "I'm good" / "No further setup needed"

If they choose "Run the demo workflow", skip to **Step 4**.
If they choose "Reconfigure", continue to **Step 2** but skip the signup part.
If they choose "I'm good", end the setup.

If no valid token is found, continue to **Step 2**.

---

## Step 2: Account Creation

Use AskUserQuestion:
- Header: "Account"
- Question: "Do you already have a Jetty account?"
- Options:
  - "Yes, I have an API key" / "I have a Jetty account and can paste my API key"
  - "No, I need to sign up" / "Open the Jetty signup page in my browser"

### If "Yes, I have an API key":
Ask the user to paste their API key using AskUserQuestion:
- Header: "API Key"
- Question: "Please paste your Jetty API key (starts with mlc_):"
- Options:
  - "I'll type it in" / "Let me enter my API key" (they will use the "Other" option to type it)
  - "I need to find it" / "Open flows.jetty.io so I can get my key"

If they need to find it, open the browser:
```bash
open "https://flows.jetty.io/settings" 2>/dev/null || xdg-open "https://flows.jetty.io/settings" 2>/dev/null
```

### If "No, I need to sign up":
Tell the user:
> "Opening Jetty in your browser. Here's what to do:
> 1. Click **Get started free** to create your account
> 2. Complete the onboarding (pick a collection name — this is your workspace)
> 3. Once you're on the dashboard, go to **Settings** to find your API key
> 4. Copy the API key and come back here to paste it"

Open the signup page:
```bash
open "https://flows.jetty.io/sign-up" 2>/dev/null || xdg-open "https://flows.jetty.io/sign-up" 2>/dev/null
```

Then wait for them to come back and paste the key. Use AskUserQuestion:
- Header: "API Key"
- Question: "Once you've signed up, paste your Jetty API key here (starts with mlc_):"
- Options:
  - "I'll type it in" / "Let me paste my API key" (they will use the "Other" option)
  - "I'm stuck" / "I need help finding my API key"

If they're stuck, provide guidance:
> "Your API key is at flows.jetty.io → Settings → API Tokens. Click Create Token, copy it, and paste it here."

### Validate the Key

Once you have the key, validate it:

```bash
TOKEN="mlc_THE_PASTED_TOKEN"
curl -s -H "Authorization: Bearer $TOKEN" "https://dock.jetty.io/api/v1/collections/"
```

**If validation fails (401 or error):**
Tell the user the key didn't work and let them try again (up to 3 attempts). After 3 failures, suggest visiting https://flows.jetty.io/settings to verify.

**If validation succeeds:**
1. Parse the response to find the collection name(s)
2. Tell the user which collections they have access to

### Save the Token

Write or update the project's `CLAUDE.md` to include the token:

```
I have a production jetty api token mlc_THE_TOKEN
```

If `CLAUDE.md` already exists, append the token line. If it doesn't exist, create it with just that line.

**Important:** Warn the user:
> "I've saved your API token to CLAUDE.md. If this project is in a git repo, make sure CLAUDE.md is in your .gitignore to avoid committing your token."

---

## Step 3: Choose Provider & Store API Key

Use AskUserQuestion:
- Header: "Provider"
- Question: "Which image generation provider would you like to use for the demo?"
- Options:
  - "OpenAI (DALL-E 3)" / "Uses DALL-E 3 for image generation and GPT-4o for judging (~$0.05/run)"
  - "Google Gemini" / "Uses Gemini image generation and Gemini Flash for judging (check Gemini pricing)"

Based on their choice, ask for the provider API key using AskUserQuestion:
- Header: "Provider Key"
- Question: "Paste your {OpenAI/Google} API key:"
- Options:
  - "I'll type it in" / "Let me paste my API key" (they will use the "Other" option)
  - "Where do I get one?" / "Help me find or create an API key"

If they need help getting a key:
- **OpenAI**: "Get your API key at https://platform.openai.com/api-keys"
  ```bash
  open "https://platform.openai.com/api-keys" 2>/dev/null || xdg-open "https://platform.openai.com/api-keys" 2>/dev/null
  ```
- **Gemini**: "Get your API key at https://aistudio.google.com/apikey"
  ```bash
  open "https://aistudio.google.com/apikey" 2>/dev/null || xdg-open "https://aistudio.google.com/apikey" 2>/dev/null
  ```

### Store the Provider Key in Collection Environment Variables

First, identify which collection to use. If the user has multiple collections, ask them to choose. If they have one, use it automatically.

Then store the key:

**For OpenAI:**
```bash
TOKEN="mlc_THE_JETTY_TOKEN"
COLLECTION="the-collection-name"
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/collections/$COLLECTION/environment" \
  -d '{"environment_variables": {"OPENAI_API_KEY": "sk-THE_OPENAI_KEY"}}'
```

**For Gemini:**
```bash
TOKEN="mlc_THE_JETTY_TOKEN"
COLLECTION="the-collection-name"
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/collections/$COLLECTION/environment" \
  -d '{"environment_variables": {"GEMINI_API_KEY": "THE_GEMINI_KEY"}}'
```

Verify the key was stored:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dock.jetty.io/api/v1/collections/$COLLECTION" | python3 -c "import sys,json; d=json.load(sys.stdin); evars=d.get('environment_variables',{}); print('Stored keys:', list(evars.keys()) if evars else 'none')"
```

Tell the user:
> "Your {provider} API key has been securely stored in your Jetty collection. Workflows will use it automatically."

---

## Step 4: Deploy the Demo Workflow

Based on the provider chosen (or detected from collection env vars), deploy the cute feline detector.

### Determine which variant to deploy

If you don't know the provider yet (e.g., user said "Run the demo workflow" with an existing token), check collection env vars:
```bash
TOKEN="mlc_THE_TOKEN"
COLLECTION="the-collection-name"
curl -s -H "Authorization: Bearer $TOKEN" "https://dock.jetty.io/api/v1/collections/$COLLECTION"
```

Look for `OPENAI_API_KEY` or `GEMINI_API_KEY` in the environment variables. If both exist, ask the user to choose. If neither exists, go back to Step 3.

### Read and deploy the template

The templates are in the plugin's skills/jetty/templates/ directory. Read the correct one:
- OpenAI: `skills/jetty/templates/cute-feline-detector-openai.json`
- Gemini: `skills/jetty/templates/cute-feline-detector-gemini.json`

Find the plugin directory by searching from the current directory or ~/.claude/:
```bash
# Find the template file
find . ~/.claude -name "cute-feline-detector-openai.json" -o -name "cute-feline-detector-gemini.json" 2>/dev/null | head -5
```

Read the template JSON, then create the task. Use the workflow JSON from the template (the entire JSON object IS the workflow):

```bash
TOKEN="mlc_THE_TOKEN"
COLLECTION="the-collection-name"
WORKFLOW_JSON='<the full JSON from the template file>'

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://dock.jetty.io/api/v1/tasks/$COLLECTION" \
  -d "{
    \"name\": \"cute-feline-detector\",
    \"description\": \"Cute Feline Detector: generates a cat image and judges its cuteness (1-5 scale)\",
    \"workflow\": $WORKFLOW_JSON
  }"
```

**If the task already exists (409 or similar error):**
Tell the user and ask if they want to run the existing one or deploy with a different name.

Tell the user:
> "Demo workflow 'cute-feline-detector' deployed to your collection!"

---

## Step 5: Run the Demo

Run the workflow with a fun prompt:

```bash
TOKEN="mlc_THE_TOKEN"
COLLECTION="the-collection-name"

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -F "bakery_host=https://dock.jetty.io" \
  -F 'init_params={"prompt": "a fluffy orange tabby cat sitting in a sunbeam"}' \
  "https://flows-api.jetty.io/api/v1/run/$COLLECTION/cute-feline-detector"
```

Capture the `workflow_id` from the response. Tell the user:
> "Running your first workflow! This generates a cat image, then judges how cute it is. Takes about 30-45 seconds..."

### Poll for completion

Wait 10 seconds, then poll:

```bash
TOKEN="mlc_THE_TOKEN"
COLLECTION="the-collection-name"
sleep 15
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectories/$COLLECTION/cute-feline-detector?limit=1" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); t=d['trajectories'][0]; print(json.dumps({'status': t['status'], 'id': t['trajectory_id']}, indent=2))"
```

If status is not "completed", wait another 15 seconds and poll again (max 4 attempts = ~60s total).

If status is "completed", get the full trajectory:

```bash
TOKEN="mlc_THE_TOKEN"
COLLECTION="the-collection-name"
TRAJECTORY_ID="the-trajectory-id"

curl -s -H "Authorization: Bearer $TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectory/$COLLECTION/cute-feline-detector/$TRAJECTORY_ID"
```

---

## Step 6: Show Results & Download

From the trajectory, extract and display:

1. **Expanded prompt** — from `.steps.expand_prompt.outputs.text`
2. **Generated image path** — from `.steps.generate_image.outputs.images[0].path`
3. **Cuteness judgment** — from `.steps.judge_cuteness.outputs.results[0].judgment`
4. **Explanation** — from `.steps.judge_cuteness.outputs.results[0].explanation`

### Download the generated image

```bash
TOKEN="mlc_THE_TOKEN"
IMAGE_PATH="the-image-path-from-trajectory"

curl -s -H "Authorization: Bearer $TOKEN" \
  "https://flows-api.jetty.io/api/v1/file/$IMAGE_PATH" \
  -o cute-cat.png
```

Tell the user where the image was saved.

### Display the summary

Present results in a nice format:

```
Your Cute Feline Detector Results
==================================

Prompt: "a fluffy orange tabby cat sitting in a sunbeam"

Expanded prompt: <the expanded version>

Cuteness Score: <judgment>/5
Explanation: <the judge's explanation>

Image saved to: ./cute-cat.png

View this run on Jetty: https://flows.jetty.io/dock/task/{COLLECTION}/cute-feline-detector
```

---

## Step 7: Next Steps

Tell the user:

> "You're all set! Here's what you can do next:
>
> **Run it again with a different prompt:**
> `/jetty run cute-feline-detector with prompt="a tiny kitten wearing a top hat"`
>
> **See all your workflows:**
> `/jetty list tasks`
>
> **Check execution history:**
> `/jetty show trajectories for cute-feline-detector`
>
> **Build your own workflow:**
> `/jetty create a workflow that...` (describe what you want)
>
> **Browse available step templates:**
> `/jetty list templates`
>
> The `/jetty` command is your gateway to the full Jetty platform. Just describe what you want in natural language."

---

## Important Notes

- **Always inline the token**: Set `TOKEN="mlc_..."` at the start of each bash command block, then use `$TOKEN`. Environment variables do not persist between bash invocations.
- **URL disambiguation**: Use `flows-api.jetty.io` for running workflows/trajectories. Use `dock.jetty.io` for collections/tasks. NEVER use `flows.jetty.io` for API calls (it's the web frontend).
- **Trajectories response shape**: The list endpoint returns `{"trajectories": [...]}` — always access via `.trajectories[]`.
- **Steps are objects, not arrays**: Trajectory steps are keyed by step name (e.g., `.steps.expand_prompt`), not by index.
- **simple_judge outputs**: Results are at `.outputs.results[0].judgment` and `.outputs.results[0].explanation`.
