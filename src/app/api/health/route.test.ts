import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("health endpoint", () => {
  it("mengembalikan status publik tanpa data sensitif dan tanpa cache", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toMatchObject({
      status: "ok",
      service: "rumah-quran-ar-rasyid",
    });
    expect(JSON.stringify(payload)).not.toContain("DATABASE_URL");
  });
});
