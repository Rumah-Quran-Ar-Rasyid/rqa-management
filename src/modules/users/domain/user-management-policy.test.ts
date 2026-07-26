import { describe, expect, it } from "vitest";

import {
  canAccessUserDirectory,
  canChangeUserStatus,
  canCreateTeacher,
} from "./user-management-policy";

describe("user management policy", () => {
  it("mengizinkan Admin mengakses daftar dan membuat Pengajar", () => {
    expect(canAccessUserDirectory(["ADMIN"])).toBe(true);
    expect(canCreateTeacher(["ADMIN"])).toBe(true);
  });

  it("mengizinkan Kepala melihat pengguna untuk mengelola role penting", () => {
    expect(canAccessUserDirectory(["HEAD"])).toBe(true);
    expect(canCreateTeacher(["HEAD"])).toBe(false);
  });

  it("mencegah Admin biasa menonaktifkan pengguna dengan role Kepala", () => {
    expect(
      canChangeUserStatus({
        actorId: "admin",
        actorRoles: ["ADMIN"],
        targetId: "kepala",
        targetRoles: ["HEAD"],
      }),
    ).toBe(false);
  });

  it("mencegah pengguna mengubah status akunnya sendiri", () => {
    expect(
      canChangeUserStatus({
        actorId: "admin",
        actorRoles: ["ADMIN", "HEAD"],
        targetId: "admin",
        targetRoles: ["ADMIN", "HEAD"],
      }),
    ).toBe(false);
  });
});
