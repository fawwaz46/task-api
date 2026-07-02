import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createDb } from "../src/db.js";

function app() {
  return createApp(createDb(":memory:"));
}

async function authedAgent() {
  const a = app();
  const res = await request(a)
    .post("/api/auth/register")
    .send({ email: "user@example.com", password: "supersecret" });
  return { a, token: res.body.token as string };
}

describe("auth", () => {
  it("registers a user and returns a token", async () => {
    const res = await request(app())
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "supersecret" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects weak passwords", async () => {
    const res = await request(app())
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects duplicate emails", async () => {
    const a = app();
    const body = { email: "dupe@b.com", password: "supersecret" };
    await request(a).post("/api/auth/register").send(body);
    const res = await request(a).post("/api/auth/register").send(body);
    expect(res.status).toBe(409);
  });
});

describe("tasks", () => {
  it("requires authentication", async () => {
    const res = await request(app()).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("creates, lists, updates and deletes a task", async () => {
    const { a, token } = await authedAgent();
    const bearer = `Bearer ${token}`;

    const created = await request(a)
      .post("/api/tasks")
      .set("Authorization", bearer)
      .send({ title: "Write README", priority: "high" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: "Write README", done: false, priority: "high" });

    const id = created.body.id;

    const list = await request(a).get("/api/tasks").set("Authorization", bearer);
    expect(list.body).toHaveLength(1);

    const updated = await request(a)
      .patch(`/api/tasks/${id}`)
      .set("Authorization", bearer)
      .send({ done: true });
    expect(updated.body.done).toBe(true);

    const del = await request(a)
      .delete(`/api/tasks/${id}`)
      .set("Authorization", bearer);
    expect(del.status).toBe(204);
  });

  it("does not leak tasks between users", async () => {
    const { a, token } = await authedAgent();
    await request(a)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "private task" });

    const other = await request(a)
      .post("/api/auth/register")
      .send({ email: "other@example.com", password: "supersecret" });

    const list = await request(a)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${other.body.token}`);
    expect(list.body).toHaveLength(0);
  });
});
