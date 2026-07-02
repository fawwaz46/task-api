import { Router } from "express";
import bcrypt from "bcryptjs";
import type { DB } from "../db.js";
import { signToken } from "../auth.js";
import { credentialsSchema, validate } from "../validation.js";

export function authRouter(db: DB): Router {
  const router = Router();

  router.post("/register", validate(credentialsSchema), (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }
    const hash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare("INSERT INTO users (email, password) VALUES (?, ?)")
      .run(email, hash);
    const userId = Number(info.lastInsertRowid);
    return res.status(201).json({ token: signToken(userId), user: { id: userId, email } });
  });

  router.post("/login", validate(credentialsSchema), (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = db
      .prepare("SELECT id, password FROM users WHERE email = ?")
      .get(email) as { id: number; password: string } | undefined;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    return res.json({ token: signToken(user.id), user: { id: user.id, email } });
  });

  return router;
}
