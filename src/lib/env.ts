import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url(),
});

const parsedEnv = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  APP_URL: process.env.APP_URL,
});

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );

  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;