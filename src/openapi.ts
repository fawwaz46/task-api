export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Task API",
    version: "1.0.0",
    description:
      "A small production-style REST API with JWT auth, per-user task ownership, validation, and rate limiting.",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Credentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          done: { type: "boolean" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Create an account and receive a JWT",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Credentials" } } } },
        responses: { "201": { description: "Created" }, "409": { description: "Email taken" } },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Log in and receive a JWT",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Credentials" } } } },
        responses: { "200": { description: "OK" }, "401": { description: "Invalid credentials" } },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["tasks"],
        summary: "List your tasks",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
      post: {
        tags: ["tasks"],
        summary: "Create a task",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } } },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/tasks/{id}": {
      get: { tags: ["tasks"], summary: "Get a task", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" }, "404": { description: "Not found" } } },
      patch: { tags: ["tasks"], summary: "Update a task", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } },
      delete: { tags: ["tasks"], summary: "Delete a task", security: [{ bearerAuth: [] }], responses: { "204": { description: "Deleted" } } },
    },
  },
} as const;
