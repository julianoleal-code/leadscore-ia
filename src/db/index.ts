import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes("placeholder")) {
  console.warn(
    "⚠️ [LeadScore IA] DATABASE_URL não configurada ou com valor placeholder. Configure no .env.local para persistência no NeonDB."
  );
}

const client = neon(connectionString || "postgresql://user:pass@ep-mock.neon.tech/neondb");
export const db = drizzle(client, { schema });

