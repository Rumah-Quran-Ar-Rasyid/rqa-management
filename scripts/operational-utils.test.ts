import { describe, expect, it } from "vitest";

import { databaseIdentity, databaseUrlSchema } from "./operational-utils";

describe("databaseUrlSchema", () => {
  it.each(["postgres://user:secret@localhost/rqa", "postgresql://localhost:5432/rqa"])(
    "menerima URL PostgreSQL %s",
    (databaseUrl) => {
      expect(databaseUrlSchema.parse(databaseUrl)).toBe(databaseUrl);
    },
  );

  it.each(["mysql://localhost/rqa", "postgres-unknown://localhost/rqa", "bukan-url"])(
    "menolak URL non-PostgreSQL %s",
    (databaseUrl) => {
      expect(() => databaseUrlSchema.parse(databaseUrl)).toThrow();
    },
  );
});

describe("databaseIdentity", () => {
  it("mengabaikan kredensial, query, dan protokol alias saat membandingkan target", () => {
    expect(databaseIdentity("postgresql://user:one@DB.EXAMPLE/rqa?sslmode=require")).toBe(
      databaseIdentity("postgres://other:two@db.example:5432/rqa?schema=public"),
    );
  });

  it("membedakan database pada host yang sama", () => {
    expect(databaseIdentity("postgresql://localhost/rqa")).not.toBe(
      databaseIdentity("postgresql://localhost/rqa_restore"),
    );
  });
});
