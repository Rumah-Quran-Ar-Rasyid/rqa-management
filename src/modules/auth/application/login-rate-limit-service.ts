import "server-only";

import { createHmac } from "node:crypto";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  isLoginLocked,
  nextFailedLoginState,
  LOGIN_RATE_LIMIT,
} from "../domain/login-rate-limit-policy";

function emailHash(email: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(email).digest("hex");
}

export async function isLoginRateLimited(email: string, now = new Date()) {
  const key = emailHash(email);
  await db.loginThrottle.deleteMany({
    where: {
      updatedAt: {
        lt: new Date(now.getTime() - LOGIN_RATE_LIMIT.retentionMs),
      },
    },
  });

  const throttle = await db.loginThrottle.findUnique({
    where: { emailHash: key },
    select: { failureCount: true, windowStartedAt: true, lockedUntil: true },
  });

  return isLoginLocked(throttle, now);
}

export async function recordFailedLogin(email: string, now = new Date()) {
  const key = emailHash(email);

  await db.$transaction(
    async (transaction) => {
      const throttle = await transaction.loginThrottle.findUnique({
        where: { emailHash: key },
        select: { failureCount: true, windowStartedAt: true, lockedUntil: true },
      });
      const next = nextFailedLoginState(throttle, now);

      await transaction.loginThrottle.upsert({
        where: { emailHash: key },
        create: { emailHash: key, ...next },
        update: next,
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function clearFailedLogins(email: string) {
  await db.loginThrottle.delete({ where: { emailHash: emailHash(email) } }).catch(() => undefined);
}
