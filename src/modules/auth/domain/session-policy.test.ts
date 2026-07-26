import { describe, expect, it } from "vitest";

import { isSessionUsable, type SessionState } from "./session-policy";

const now = new Date("2026-07-24T08:00:00.000Z");

function activeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    expiresAt: new Date("2026-07-25T08:00:00.000Z"),
    revokedAt: null,
    organizationStatus: "ACTIVE",
    userStatus: "ACTIVE",
    roles: ["TEACHER"],
    ...overrides,
  };
}

describe("isSessionUsable", () => {
  it("menerima sesi aktif dengan role", () => {
    expect(isSessionUsable(activeSession(), now)).toBe(true);
  });

  it("menolak sesi kosong, kedaluwarsa, atau dicabut", () => {
    expect(isSessionUsable(null, now)).toBe(false);
    expect(
      isSessionUsable(
        activeSession({ expiresAt: new Date("2026-07-24T07:59:59.000Z") }),
        now,
      ),
    ).toBe(false);
    expect(
      isSessionUsable(activeSession({ revokedAt: new Date() }), now),
    ).toBe(false);
  });

  it("menolak pengguna atau organisasi nonaktif", () => {
    expect(
      isSessionUsable(activeSession({ userStatus: "INACTIVE" }), now),
    ).toBe(false);
    expect(
      isSessionUsable(
        activeSession({ organizationStatus: "INACTIVE" }),
        now,
      ),
    ).toBe(false);
  });

  it("menolak pengguna aktif tanpa role", () => {
    expect(isSessionUsable(activeSession({ roles: [] }), now)).toBe(false);
  });
});
