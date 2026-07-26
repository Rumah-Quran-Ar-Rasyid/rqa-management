import "dotenv/config";

import { createDatabaseClient, databaseUrlSchema } from "./operational-utils";
import { collectPilotReadiness } from "./pilot-readiness";

const databaseUrl = databaseUrlSchema.parse(
  process.env.DIRECT_URL ?? process.env.DATABASE_URL,
);
const prisma = createDatabaseClient(databaseUrl);

async function main() {
  try {
    const checks = await collectPilotReadiness(prisma);
    for (const check of checks) {
      console.info(`${check.ok ? "LULUS" : "GAGAL"} — ${check.name}: ${check.detail}`);
    }
    if (checks.some((check) => !check.ok)) {
      throw new Error("Preflight data pilot belum lulus.");
    }
    console.info("Preflight data pilot lulus.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
