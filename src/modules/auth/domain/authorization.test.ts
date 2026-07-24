import { describe, expect, it } from "vitest";

import {
  PERMISSIONS,
  canManageRole,
  canRemoveActiveHead,
  isAuthorized,
} from "./authorization";

describe("authorization", () => {
  it("mengizinkan Admin aktif pada organisasi yang sama", () => {
    expect(
      isAuthorized(
        {
          organizationId: "org-a",
          roles: ["ADMIN"],
          status: "ACTIVE",
        },
        PERMISSIONS.MANAGE_USER,
        "org-a",
      ),
    ).toBe(true);
  });

  it("menolak pengguna nonaktif dan organisasi lain", () => {
    expect(
      isAuthorized(
        {
          organizationId: "org-a",
          roles: ["ADMIN"],
          status: "INACTIVE",
        },
        PERMISSIONS.MANAGE_USER,
        "org-a",
      ),
    ).toBe(false);

    expect(
      isAuthorized(
        {
          organizationId: "org-a",
          roles: ["ADMIN"],
          status: "ACTIVE",
        },
        PERMISSIONS.MANAGE_USER,
        "org-b",
      ),
    ).toBe(false);
  });

  it("memisahkan pengelolaan role Admin dan Kepala", () => {
    expect(canManageRole(["ADMIN"], "TEACHER")).toBe(true);
    expect(canManageRole(["ADMIN"], "ADMIN")).toBe(false);
    expect(canManageRole(["ADMIN"], "HEAD")).toBe(false);
    expect(canManageRole(["HEAD"], "ADMIN")).toBe(true);
    expect(canManageRole(["HEAD"], "HEAD")).toBe(true);
  });

  it("melindungi Kepala aktif terakhir", () => {
    expect(canRemoveActiveHead(1)).toBe(false);
    expect(canRemoveActiveHead(2)).toBe(true);
  });
});
