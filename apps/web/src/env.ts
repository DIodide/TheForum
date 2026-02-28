import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables — never exposed to the browser.
   * Add new server vars here + to .env.local and .env.example.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  /**
   * Client-side environment variables — must be prefixed with NEXT_PUBLIC_.
   * Add new client vars here + to .env.local and .env.example.
   */
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
  },

  /**
   * Explicit mapping from process.env — required for T3 env to validate at runtime.
   * Every key declared above must appear here.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  /**
   * Throw on missing env vars in production; warn in development.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
