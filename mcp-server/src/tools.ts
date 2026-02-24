import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JettyClient } from "./client.js";

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerTools(server: McpServer, client: JettyClient) {
  // ── Collections ──────────────────────────────────────────────

  server.tool("list-collections", "List all collections", {}, async () => {
    return jsonResult(await client.listCollections());
  });

  server.tool(
    "get-collection",
    "Get collection details including environment variable keys",
    { collection: z.string().describe("Collection name") },
    async ({ collection }) => {
      return jsonResult(await client.getCollection(collection));
    }
  );

  // ── Tasks ────────────────────────────────────────────────────

  server.tool(
    "list-tasks",
    "List tasks in a collection",
    { collection: z.string().describe("Collection name") },
    async ({ collection }) => {
      return jsonResult(await client.listTasks(collection));
    }
  );

  server.tool(
    "get-task",
    "Get task details including workflow definition",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
    },
    async ({ collection, task }) => {
      return jsonResult(await client.getTask(collection, task));
    }
  );

  server.tool(
    "create-task",
    "Create a new task with a workflow definition",
    {
      collection: z.string().describe("Collection name"),
      name: z.string().describe("Task name"),
      description: z.string().optional().describe("Task description"),
      workflow: z
        .record(z.unknown())
        .describe(
          "Workflow JSON with init_params, step_configs, and steps"
        ),
    },
    async ({ collection, name, description, workflow }) => {
      return jsonResult(
        await client.createTask(collection, name, workflow, description)
      );
    }
  );

  server.tool(
    "update-task",
    "Update a task's workflow or description",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
      workflow: z
        .record(z.unknown())
        .optional()
        .describe("Updated workflow JSON"),
      description: z.string().optional().describe("Updated description"),
    },
    async ({ collection, task, workflow, description }) => {
      const updates: { workflow?: unknown; description?: string } = {};
      if (workflow) updates.workflow = workflow;
      if (description) updates.description = description;
      return jsonResult(await client.updateTask(collection, task, updates));
    }
  );

  // ── Run Workflows ────────────────────────────────────────────

  server.tool(
    "run-workflow",
    "Run a workflow asynchronously (returns immediately with workflow_id)",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
      init_params: z
        .record(z.unknown())
        .optional()
        .describe("Input parameters for the workflow"),
    },
    async ({ collection, task, init_params }) => {
      return jsonResult(
        await client.runWorkflow(
          collection,
          task,
          init_params as Record<string, unknown>
        )
      );
    }
  );

  server.tool(
    "run-workflow-sync",
    "Run a workflow synchronously (blocks until completion, may take 30-60s)",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
      init_params: z
        .record(z.unknown())
        .optional()
        .describe("Input parameters for the workflow"),
    },
    async ({ collection, task, init_params }) => {
      return jsonResult(
        await client.runWorkflowSync(
          collection,
          task,
          init_params as Record<string, unknown>
        )
      );
    }
  );

  // ── Trajectories ─────────────────────────────────────────────

  server.tool(
    "list-trajectories",
    "List recent workflow runs (trajectories) for a task",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
      limit: z.number().optional().default(10).describe("Max results"),
      page: z.number().optional().default(1).describe("Page number"),
    },
    async ({ collection, task, limit, page }) => {
      return jsonResult(
        await client.listTrajectories(collection, task, limit, page)
      );
    }
  );

  server.tool(
    "get-trajectory",
    "Get full details of a specific workflow run",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
      trajectory_id: z.string().describe("Trajectory ID"),
    },
    async ({ collection, task, trajectory_id }) => {
      return jsonResult(
        await client.getTrajectory(collection, task, trajectory_id)
      );
    }
  );

  // ── Stats ────────────────────────────────────────────────────

  server.tool(
    "get-stats",
    "Get execution statistics for a task",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
    },
    async ({ collection, task }) => {
      return jsonResult(await client.getStats(collection, task));
    }
  );

  // ── Labels ───────────────────────────────────────────────────

  server.tool(
    "add-label",
    "Add a label to a trajectory (e.g., quality=high)",
    {
      collection: z.string().describe("Collection name"),
      task: z.string().describe("Task name"),
      trajectory_id: z.string().describe("Trajectory ID"),
      key: z.string().describe("Label key (e.g., 'quality', 'status')"),
      value: z.string().describe("Label value (e.g., 'high', 'approved')"),
      author: z.string().describe("Author email"),
    },
    async ({ collection, task, trajectory_id, key, value, author }) => {
      return jsonResult(
        await client.addLabel(collection, task, trajectory_id, key, value, author)
      );
    }
  );

  // ── Step Templates ───────────────────────────────────────────

  server.tool(
    "list-step-templates",
    "List all available workflow step templates",
    {},
    async () => {
      return jsonResult(await client.listStepTemplates());
    }
  );

  server.tool(
    "get-step-template",
    "Get details and schema for a step template",
    { name: z.string().describe("Step template activity name") },
    async ({ name }) => {
      return jsonResult(await client.getStepTemplate(name));
    }
  );
}
