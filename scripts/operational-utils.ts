import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";

export const databaseUrlSchema = z.string().url().refine(
  (value) => {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  },
  "URL database harus memakai protokol PostgreSQL.",
);

export function databaseIdentity(databaseUrl: string) {
  const url = new URL(databaseUrlSchema.parse(databaseUrl));
  const port = url.port || "5432";
  return `${url.hostname.toLowerCase()}:${port}${url.pathname}`;
}

export function createDatabaseClient(databaseUrl: string) {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrlSchema.parse(databaseUrl),
      max: 2,
    }),
  });
}

export function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function currentDateInTimezone(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function readArgument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function hasFlag(name: string) {
  return process.argv.includes(name);
}
