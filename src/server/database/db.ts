import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schemas/index";

import type { D1Database } from "@cloudflare/workers-types";

export const getDB = (binding: D1Database) => {
  return drizzle(binding, { schema });
};

export type DrizzleDB = ReturnType<typeof getDB>;
