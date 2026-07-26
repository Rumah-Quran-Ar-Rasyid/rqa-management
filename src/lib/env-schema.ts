import { z } from "zod";

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().startsWith("mysql://"),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.url(),
});

export function parseServerEnv(
  values: Record<string, string | undefined>,
) {
  const result = serverEnvSchema.safeParse(values);

  if (!result.success) {
    console.error(
      "Invalid server environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error("Invalid server environment variables");
  }

  return result.data;
}
