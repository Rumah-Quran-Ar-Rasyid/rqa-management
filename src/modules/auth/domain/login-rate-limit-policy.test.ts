import { describe, expect, it } from "vitest";

import {
  isLoginLocked,
  nextFailedLoginState,
  LOGIN_RATE_LIMIT,
  type LoginThrottleState,
} from "./login-rate-limit-policy";

describe("login rate-limit policy", () => {
  it("mengunci percobaan kelima dalam jendela yang sama", () => {
    const now = new Date("2026-07-26T00:00:00.000Z");
    let state: LoginThrottleState | null = null;

    for (let attempt = 0; attempt < LOGIN_RATE_LIMIT.maxFailures; attempt += 1) {
      state = nextFailedLoginState(state, now);
    }

    expect(state).not.toBeNull();
    if (!state) throw new Error("State throttle harus tersedia setelah kegagalan login.");
    expect(state.failureCount).toBe(5);
    expect(isLoginLocked(state, now)).toBe(true);
  });

  it("memulai ulang hitungan setelah jendela kedaluwarsa", () => {
    const startedAt = new Date("2026-07-26T00:00:00.000Z");
    const now = new Date(startedAt.getTime() + LOGIN_RATE_LIMIT.windowMs);
    const state = nextFailedLoginState(
      { failureCount: 4, windowStartedAt: startedAt, lockedUntil: null },
      now,
    );

    expect(state).toMatchObject({ failureCount: 1, windowStartedAt: now, lockedUntil: null });
  });

  it("membuka kembali akses ketika waktu kunci telah berlalu", () => {
    const now = new Date("2026-07-26T00:00:00.000Z");

    expect(
      isLoginLocked(
        {
          failureCount: 5,
          windowStartedAt: now,
          lockedUntil: new Date(now.getTime() - 1),
        },
        now,
      ),
    ).toBe(false);
  });
});
