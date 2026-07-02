import { Router } from "express";
import type { DB } from "../db.js";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { createTaskSchema, updateTaskSchema, validate } from "../validation.js";

interface TaskRow {
  id: number;
  user_id: number;
  title: string;
  done: number;
  priority: string;
  created_at: string;
  updated_at: string;
}

const serialize = (t: TaskRow) => ({
  id: t.id,
  title: t.title,
  done: Boolean(t.done),
  priority: t.priority,
  createdAt: t.created_at,
  updatedAt: t.updated_at,
});

export function tasksRouter(db: DB): Router {
  const router = Router();
  router.use(requireAuth);

  // List — all tasks for the authenticated user.
  router.get("/", (req: AuthedRequest, res) => {
    const rows = db
      .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC")
      .all(req.userId) as TaskRow[];
    res.json(rows.map(serialize));
  });

  // Create
  router.post("/", validate(createTaskSchema), (req: AuthedRequest, res) => {
    const { title, priority = "medium" } = req.body;
    const info = db
      .prepare("INSERT INTO tasks (user_id, title, priority) VALUES (?, ?, ?)")
      .run(req.userId, title, priority);
    const row = db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(info.lastInsertRowid) as TaskRow;
    res.status(201).json(serialize(row));
  });

  // Read one
  router.get("/:id", (req: AuthedRequest, res) => {
    const row = ownedTask(db, req.userId!, req.params.id);
    if (!row) return res.status(404).json({ error: "Task not found." });
    res.json(serialize(row));
  });

  // Update
  router.patch("/:id", validate(updateTaskSchema), (req: AuthedRequest, res) => {
    const row = ownedTask(db, req.userId!, req.params.id);
    if (!row) return res.status(404).json({ error: "Task not found." });

    const next = {
      title: req.body.title ?? row.title,
      done: req.body.done ?? Boolean(row.done),
      priority: req.body.priority ?? row.priority,
    };
    db.prepare(
      "UPDATE tasks SET title = ?, done = ?, priority = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(next.title, next.done ? 1 : 0, next.priority, row.id);

    const updated = db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(row.id) as TaskRow;
    res.json(serialize(updated));
  });

  // Delete
  router.delete("/:id", (req: AuthedRequest, res) => {
    const row = ownedTask(db, req.userId!, req.params.id);
    if (!row) return res.status(404).json({ error: "Task not found." });
    db.prepare("DELETE FROM tasks WHERE id = ?").run(row.id);
    res.status(204).end();
  });

  return router;
}

function ownedTask(db: DB, userId: number, id: string): TaskRow | undefined {
  return db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(id, userId) as TaskRow | undefined;
}
