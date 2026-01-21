import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI } from "better-auth/plugins";

import { getDB } from "@server/database/db";
import * as schema from "@server/database/schemas";

export const auth = betterAuth({
  database: drizzleAdapter(getDB(env.DB), {
    provider: "sqlite",
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin(), openAPI()],
});
