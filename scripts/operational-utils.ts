import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";

export const databaseUrlSchema = z.string().startsWith("mysql://");

export function createDatabaseClient(databaseUrl: string) {
  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrlSchema.parse(databaseUrl)),
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

export function replaceDatabaseName(databaseUrl: string, databaseName: string) {
  const queryIndex = databaseUrl.indexOf("?");
  const base = queryIndex >= 0 ? databaseUrl.slice(0, queryIndex) : databaseUrl;
  const query = queryIndex >= 0 ? databaseUrl.slice(queryIndex) : "";
  const authorityEnd = base.indexOf("/", "mysql://".length);
  if (authorityEnd < 0) {
    throw new Error("DATABASE_URL harus memuat nama database.");
  }
  return `${base.slice(0, authorityEnd)}/${databaseName}${query}`;
}

export function readArgument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function hasFlag(name: string) {
  return process.argv.includes(name);
}
