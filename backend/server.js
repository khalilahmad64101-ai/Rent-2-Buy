import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("[ENV] Loaded .env successfully");
} else {
  console.log("[ENV ERROR] .env not found!");
}

import { connectDatabase } from "./src/config/db.js";
import { createApp } from "./src/app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDatabase();

  const app = await createApp();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[FATAL ERROR]", err);
});