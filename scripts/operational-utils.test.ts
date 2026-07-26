import { describe, expect, it } from "vitest";

import { replaceDatabaseName } from "./operational-utils";

describe("operational utils", () => {
  it("mengganti database tanpa mengubah kredensial URL", () => {
    expect(
      replaceDatabaseName("mysql://user:p%40ss@127.0.0.1:3306/mydb", "restore_check"),
    ).toBe("mysql://user:p%40ss@127.0.0.1:3306/restore_check");
  });
});
