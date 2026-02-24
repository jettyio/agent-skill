const DOCK_URL = process.env.JETTY_DOCK_URL || "https://dock.jetty.io";
const FLOWS_URL = process.env.JETTY_FLOWS_URL || "https://flows-api.jetty.io";

export class JettyClient {
  private token: string;
  private dockUrl: string;
  private flowsUrl: string;

  constructor() {
    const token = process.env.JETTY_API_TOKEN;
    if (!token) {
      throw new Error(
        "JETTY_API_TOKEN environment variable is required. " +
          "Get your token at https://flows.jetty.io → Settings → API Tokens"
      );
    }
    this.token = token;
    this.dockUrl = DOCK_URL;
    this.flowsUrl = FLOWS_URL;
  }

  private async request(
    baseUrl: string,
    path: string,
    options: RequestInit = {}
  ): Promise<unknown> {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Jetty API error ${res.status}: ${body}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return res.text();
  }

  private dock(path: string, options?: RequestInit) {
    return this.request(this.dockUrl, path, options);
  }

  private flows(path: string, options?: RequestInit) {
    return this.request(this.flowsUrl, path, options);
  }

  // Collections
  async listCollections() {
    return this.dock("/api/v1/collections/");
  }

  async getCollection(collection: string) {
    return this.dock(`/api/v1/collections/${collection}`);
  }

  // Tasks
  async listTasks(collection: string) {
    return this.dock(`/api/v1/tasks/${collection}/`);
  }

  async getTask(collection: string, task: string) {
    return this.dock(`/api/v1/tasks/${collection}/${task}`);
  }

  async createTask(
    collection: string,
    name: string,
    workflow: unknown,
    description?: string
  ) {
    return this.dock(`/api/v1/tasks/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || "", workflow }),
    });
  }

  async updateTask(
    collection: string,
    task: string,
    updates: { workflow?: unknown; description?: string }
  ) {
    return this.dock(`/api/v1/tasks/${collection}/${task}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(collection: string, task: string) {
    return this.dock(`/api/v1/tasks/${collection}/${task}`, {
      method: "DELETE",
    });
  }

  // Run workflows
  async runWorkflow(
    collection: string,
    task: string,
    initParams?: Record<string, unknown>
  ) {
    const formData = new FormData();
    formData.append("bakery_host", this.dockUrl);
    formData.append("init_params", JSON.stringify(initParams || {}));

    return this.flows(`/api/v1/run/${collection}/${task}`, {
      method: "POST",
      body: formData,
    });
  }

  async runWorkflowSync(
    collection: string,
    task: string,
    initParams?: Record<string, unknown>
  ) {
    const formData = new FormData();
    formData.append("bakery_host", this.dockUrl);
    formData.append("init_params", JSON.stringify(initParams || {}));

    return this.flows(`/api/v1/run-sync/${collection}/${task}`, {
      method: "POST",
      body: formData,
    });
  }

  // Trajectories
  async listTrajectories(
    collection: string,
    task: string,
    limit = 10,
    page = 1
  ) {
    return this.flows(
      `/api/v1/db/trajectories/${collection}/${task}?limit=${limit}&page=${page}`
    );
  }

  async getTrajectory(
    collection: string,
    task: string,
    trajectoryId: string
  ) {
    return this.flows(
      `/api/v1/db/trajectory/${collection}/${task}/${trajectoryId}`
    );
  }

  // Stats
  async getStats(collection: string, task: string) {
    return this.flows(`/api/v1/db/stats/${collection}/${task}`);
  }

  // Labels
  async addLabel(
    collection: string,
    task: string,
    trajectoryId: string,
    key: string,
    value: string,
    author: string
  ) {
    return this.flows(
      `/api/v1/trajectory/${collection}/${task}/${trajectoryId}/labels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, author }),
      }
    );
  }

  // Workflow logs
  async getWorkflowLogs(workflowId: string) {
    return this.flows(`/api/v1/workflows-logs/${workflowId}`);
  }

  // Step templates
  async listStepTemplates() {
    return this.request(this.flowsUrl, "/api/v1/step-templates");
  }

  async getStepTemplate(name: string) {
    return this.request(this.flowsUrl, `/api/v1/step-templates/${name}`);
  }

  // Environment variables
  async setEnvironmentVars(
    collection: string,
    vars: Record<string, string>
  ) {
    return this.dock(`/api/v1/collections/${collection}/environment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environment_variables: vars }),
    });
  }
}
