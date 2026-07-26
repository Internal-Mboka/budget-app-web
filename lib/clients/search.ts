import type { ClientCategory, Prisma } from "@prisma/client";

import { CLIENT_CATEGORY_OPTIONS } from "@/lib/clients/categories";

export type ClientSearchResult = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
};

function matchingCategories(query: string): ClientCategory[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return CLIENT_CATEGORY_OPTIONS.filter(
    (option) =>
      option.label.toLowerCase().includes(normalized) ||
      option.value.toLowerCase().replace(/_/g, " ").includes(normalized)
  ).map((option) => option.value);
}

export function buildClientSearchWhere(query: string): Prisma.ClientWhereInput {
  const term = query.trim();
  const categories = matchingCategories(term);

  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      ...(categories.length > 0 ? [{ category: { in: categories } }] : []),
    ],
  };
}

export const CLIENT_SEARCH_MIN_LENGTH = 2;
export const CLIENT_SEARCH_LIMIT = 8;
