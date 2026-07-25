export const LOGIN_RATE_LIMIT = {
  maxFailures: 5,
  windowMs: 15 * 60 * 1000,
  retentionMs: 24 * 60 * 60 * 1000,
} as const;

export type LoginThrottleState = {
  failureCount: number;
  windowStartedAt: Date;
  lockedUntil: Date | null;
};

export function isLoginLocked(state: LoginThrottleState | null, now: Date) {
  return Boolean(state?.lockedUntil && state.lockedUntil > now);
}

export function isLoginWindowExpired(state: LoginThrottleState, now: Date) {
  return now.getTime() - state.windowStartedAt.getTime() >= LOGIN_RATE_LIMIT.windowMs;
}

export function nextFailedLoginState(state: LoginThrottleState | null, now: Date) {
  const failureCount = !state || isLoginWindowExpired(state, now)
    ? 1
    : state.failureCount + 1;
  const windowStartedAt = !state || isLoginWindowExpired(state, now)
    ? now
    : state.windowStartedAt;

  return {
    failureCount,
    windowStartedAt,
    lockedUntil:
      failureCount >= LOGIN_RATE_LIMIT.maxFailures
        ? new Date(now.getTime() + LOGIN_RATE_LIMIT.windowMs)
        : null,
  };
}
