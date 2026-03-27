# Batch Runs

When running multiple workflows (e.g., test suites), write a bash script to `/tmp` and execute it. The Bash tool has escaping issues with inline arrays and functions in zsh.

## Example Batch Script

```bash
# Write script to /tmp, then run with: bash /tmp/batch_run.sh
#!/bin/bash
TOKEN="$(cat ~/.config/jetty/token)"

run_wf() {
  local prompt="$1"
  echo "--- $prompt"
  curl -s -X POST -H "Authorization: Bearer $TOKEN" \
      -F "init_params={\"prompt\": \"$prompt\"}" \
    "https://flows-api.jetty.io/api/v1/run/{COLLECTION}/{TASK}" | jq -r '.workflow_id'
}

run_wf "test prompt 1"
run_wf "test prompt 2"
```

## Checking Results

After launching, wait ~45-60 seconds, then check statuses:

```bash
TOKEN="$(cat ~/.config/jetty/token)"
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://flows-api.jetty.io/api/v1/db/trajectories/{COLLECTION}/{TASK}?limit=10" \
  | jq '[.trajectories[] | {id: .trajectory_id, status: .status}]'
```
