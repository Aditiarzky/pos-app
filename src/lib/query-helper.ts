import { NextRequest } from "next/server";
import { ilike, sql } from "drizzle-orm";

export function parsePagination(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const orderBy = searchParams.get("orderBy") || "createdAt";
  const search = searchParams.get("search")?.trim() || "";
  const offset = (page - 1) * limit;

  return { page, limit, order, orderBy, search, offset };
}

export function getSearchAndOrderFTS(
  search: string,
  order: "asc" | "desc",
  orderBy: string,
  table: any
) {
  if (!search) {
    return {
      searchFilter: undefined,
      searchOrder: (fields: any, { asc, desc }: any) => [
        order === "asc" ? asc(fields[orderBy]) : desc(fields[orderBy]),
      ],
    };
  }

  const formattedSearch = search
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(" & ");

  const searchQuery = sql`to_tsquery('indonesian', ${formattedSearch})`;

  return {
    searchFilter: sql`${table.searchVector} @@ ${searchQuery}`,
    searchOrder: (fields: any, { asc, desc }: any) => [
      order === "asc"
        ? asc(sql`ts_rank(${fields.searchVector}, ${searchQuery})`)
        : desc(sql`ts_rank(${fields.searchVector}, ${searchQuery})`),
    ],
  };
}

export function getSearchAndOrderBasic(
  search: string,
  order: "asc" | "desc",
  orderBy: string,
  column: any
) {
  if (!search) {
    return {
      searchFilter: undefined,
      searchOrder: (fields: any, { asc, desc }: any) => [
        order === "asc" ? asc(fields[orderBy]) : desc(fields[orderBy]),
      ],
    };
  }

  return {
    searchFilter: ilike(column, `%${search}%`),
    searchOrder: (fields: any, { asc, desc }: any) => [
      order === "asc" ? asc(fields[orderBy]) : desc(fields[orderBy]),
    ],
  };
}

export function formatMeta(totalCount: number, page: number, limit: number) {
  return {
    page,
    limit,
    total: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}
