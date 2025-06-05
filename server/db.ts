import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// SECURITY FIX: Enable SSL for database connections in production
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Enforce SSL in production environments
  ...(process.env.NODE_ENV === 'production' && {
    ssl: {
      rejectUnauthorized: false, // For managed database services like Neon
      require: true
    }
  })
};

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });