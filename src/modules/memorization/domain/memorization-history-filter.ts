import { z } from "zod";

const queryString = z.string().trim().min(1).optional();

const memorizationHistoryFilterSchema = z.object({
  academicPeriodId: queryString,
  submissionCategory: z
    .enum(["SABAQ", "SABQI", "MANZIL"])
    .optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type MemorizationHistoryFilters = {
  academicPeriodId?: string;
  submissionCategory?: "SABAQ" | "SABQI" | "MANZIL";
};

export type MemorizationHistorySearchParams = Record<
  string,
  string | string[] | undefined
>;

function oneQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? undefined : value;
}

export function parseMemorizationHistoryFilters(
  searchParams: MemorizationHistorySearchParams,
): MemorizationHistoryFilters & { page: number } {
  const result = memorizationHistoryFilterSchema.safeParse({
    academicPeriodId: oneQueryValue(searchParams.academicPeriodId),
    submissionCategory: oneQueryValue(searchParams.submissionCategory),
    page: oneQueryValue(searchParams.page),
  });

  if (!result.success) {
    return { page: 1 };
  }

  return {
    academicPeriodId: result.data.academicPeriodId,
    submissionCategory: result.data.submissionCategory,
    page: result.data.page ?? 1,
  };
}
