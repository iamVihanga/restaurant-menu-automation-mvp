import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/database/schemas/index.ts",
  out: "./src/server/database/migrations",
  dialect: "sqlite",
  driver: "d1-http",
});
