import "dotenv/config";
import { createApp } from "./app.js";
import { createDb } from "./db.js";

const port = Number(process.env.PORT ?? 3000);
const app = createApp(createDb());

app.listen(port, () => {
  console.log(`task-api listening on http://localhost:${port}`);
  console.log(`API docs at http://localhost:${port}/docs`);
});
