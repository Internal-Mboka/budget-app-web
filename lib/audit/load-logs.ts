import type { Prisma } from "@prisma/client";

import { buildPaginationMeta, DEFAULT_PAGE_SIZE, parsePagination, type PaginationMeta } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export type AuditLogFilters = {
  from?: string;
  to?: string;
  action?: string;
  entity?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogListItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type AuditLogDetail = AuditLogListItem & {
  details: unknown;
};

const listSelect = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  createdAt: true,
  ipAddress: true,
  userAgent: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

function mapListRow(row: {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  user: AuditLogListItem["user"];
}): AuditLogListItem {
  return {
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    createdAt: row.createdAt.toISOString(),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    user: row.user,
  };
}

export function parseAuditLogFilters(input: {
  from?: string;
  to?: string;
  action?: string;
  entity?: string;
  userId?: string;
  page?: string;
  pageSize?: string;
}): AuditLogFilters {
  const pagination = parsePagination(input);

  return {
    from: input.from?.match(/^\d{4}-\d{2}-\d{2}$/) ? input.from : undefined,
    to: input.to?.match(/^\d{4}-\d{2}-\d{2}$/) ? input.to : undefined,
    action: input.action?.trim() || undefined,
    entity: input.entity?.trim() || undefined,
    userId: input.userId?.trim() || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

function buildWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.from || filters.to) {
    where.createdAt = {};

    if (filters.from) {
      where.createdAt.gte = new Date(`${filters.from}T00:00:00.000`);
    }

    if (filters.to) {
      where.createdAt.lte = new Date(`${filters.to}T23:59:59.999`);
    }
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entity) {
    where.entity = filters.entity;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  return where;
}

export async function loadAuditLogs(filters: AuditLogFilters = {}): Promise<{
  items: AuditLogListItem[];
  pagination: PaginationMeta;
}> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: listSelect,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: rows.map(mapListRow),
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function loadAuditLogById(id: string): Promise<AuditLogDetail | null> {
  const row = await prisma.auditLog.findUnique({
    where: { id },
    select: {
      ...listSelect,
      details: true,
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...mapListRow(row),
    details: row.details,
  };
}

export async function loadAuditActorOptions(): Promise<
  Array<{ id: string; label: string; email: string }>
> {
  const rows = await prisma.auditLog.findMany({
    distinct: ["userId"],
    select: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((row) => ({
    id: row.user.id,
    label: `${row.user.firstName} ${row.user.lastName}`,
    email: row.user.email,
  }));
}

export async function loadAuditLogsForExport(filters: AuditLogFilters = {}): Promise<
  Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    userEmail: string;
    userName: string;
    details: unknown;
  }>
> {
  const where = buildWhere(filters);

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      createdAt: true,
      ipAddress: true,
      userAgent: true,
      details: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    createdAt: row.createdAt.toISOString(),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    userEmail: row.user.email,
    userName: `${row.user.firstName} ${row.user.lastName}`,
    details: row.details,
  }));
}
