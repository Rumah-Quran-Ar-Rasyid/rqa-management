import { z } from "zod";

const queryString = z.string().trim().min(1).optional();

const headDashboardFilterSchema = z.object({
  academicPeriodId: queryString,
  halaqahId: queryString,
});

export type HeadDashboardFilters = {
  academicPeriodId?: string;
  halaqahId?: string;
};

export type HeadDashboardSearchParams = Record<
  string,
  string | string[] | undefined
>;

function oneQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? undefined : value;
}

export function parseHeadDashboardFilters(
  searchParams: HeadDashboardSearchParams,
): HeadDashboardFilters {
  const result = headDashboardFilterSchema.safeParse({
    academicPeriodId: oneQueryValue(searchParams.academicPeriodId),
    halaqahId: oneQueryValue(searchParams.halaqahId),
  });

  if (!result.success) {
    return {};
  }

  const filters: HeadDashboardFilters = {};

  if (result.data.academicPeriodId) {
    filters.academicPeriodId = result.data.academicPeriodId;
  }
  if (result.data.halaqahId) {
    filters.halaqahId = result.data.halaqahId;
  }

  return filters;
}
