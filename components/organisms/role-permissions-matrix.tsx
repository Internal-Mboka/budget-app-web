"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { toggleRolePermissionAction } from "@/lib/actions/roles";
import {
  mbokaLabelClassName,
  mbokaPanelClassName,
  ROLE_LABELS,
} from "@/lib/design-tokens";
import { getPermissionDescription, getPermissionLabel, groupPermissionsByCategory } from "@/lib/permissions/labels";
import { cn } from "@/lib/utils";

export type RolePermissionsRow = {
  id: number;
  name: string;
  description: string | null;
  permissionSlugs: string[];
};

type PermissionRow = {
  id: number;
  slug: string;
  description: string | null;
};

type RolePermissionsMatrixProps = {
  initialRoles: RolePermissionsRow[];
  permissions: PermissionRow[];
};

function buildRoleOptions(roles: RolePermissionsRow[]) {
  return roles.map((role) => ({
    value: String(role.id),
    label: ROLE_LABELS[role.name] ?? role.name,
  }));
}

function toPermissionMap(roles: RolePermissionsRow[]): Record<number, Set<string>> {
  return Object.fromEntries(
    roles.map((role) => [role.id, new Set(role.permissionSlugs)])
  );
}

export function RolePermissionsMatrix({
  initialRoles,
  permissions,
}: RolePermissionsMatrixProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState(String(initialRoles[0]?.id ?? ""));
  const [permissionMap, setPermissionMap] = useState(() => toPermissionMap(initialRoles));
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const roleOptions = useMemo(() => buildRoleOptions(roles), [roles]);
  const selectedRole = roles.find((role) => String(role.id) === selectedRoleId);

  useEffect(() => {
    setRoles(initialRoles);
    setPermissionMap(toPermissionMap(initialRoles));
  }, [initialRoles]);

  async function handleToggle(permissionSlug: string, enabled: boolean) {
    if (!selectedRole) {
      return;
    }

    const roleId = selectedRole.id;
    const pendingId = `${roleId}:${permissionSlug}`;
    const previousSlugs = permissionMap[roleId] ?? new Set<string>();

    const nextSlugs = new Set(previousSlugs);
    if (enabled) {
      nextSlugs.add(permissionSlug);
    } else {
      nextSlugs.delete(permissionSlug);
    }

    setPermissionMap((current) => ({
      ...current,
      [roleId]: nextSlugs,
    }));
    setPendingKey(pendingId);

    const formData = new FormData();
    formData.set("roleId", String(roleId));
    formData.set("permissionSlug", permissionSlug);
    formData.set("enabled", String(enabled));

    const result = await toggleRolePermissionAction(formData);

    setPendingKey(null);

    if (!result.success) {
      setPermissionMap((current) => ({
        ...current,
        [roleId]: previousSlugs,
      }));
      toast.error(result.error);
      return;
    }

    setRoles((current) =>
      current.map((role) =>
        role.id === roleId
          ? { ...role, permissionSlugs: Array.from(nextSlugs).sort() }
          : role
      )
    );

    toast.success(enabled ? "Permission accordée." : "Permission retirée.");
  }

  const activeSlugs = selectedRole ? (permissionMap[selectedRole.id] ?? new Set<string>()) : new Set<string>();
  const permissionGroups = useMemo(() => groupPermissionsByCategory(permissions), [permissions]);

  function renderPermissionCard(permission: PermissionRow) {
    const checked = activeSlugs.has(permission.slug);
    const isPending = pendingKey === `${selectedRole?.id}:${permission.slug}`;
    const inputId = `permission-${permission.slug}`;
    const label = getPermissionLabel(permission.slug, permission.description);
    const description = getPermissionDescription(permission.slug, permission.description);

    return (
      <label
        key={permission.id}
        htmlFor={inputId}
        data-testid={`permission-${permission.slug}`}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
          checked
            ? "border-sky-200 bg-sky-50/70 dark:border-sky-800 dark:bg-sky-950/25"
            : "border-sky-100 bg-white dark:border-sky-900 dark:bg-slate-900/50"
        )}
      >
        <span className="relative mt-1 flex size-5 shrink-0 items-center justify-center">
          <input
            id={inputId}
            type="checkbox"
            checked={checked}
            disabled={!selectedRole || isPending}
            onChange={(event) => {
              void handleToggle(permission.slug, event.target.checked);
            }}
            className="size-4 rounded border-sky-200 text-[#10579F] focus:ring-[#10579F] dark:border-sky-800"
            data-testid={`permission-${permission.slug}-input`}
          />
          {isPending ? (
            <Loader2 className="absolute -right-5 size-4 animate-spin text-[#10579F]" />
          ) : null}
        </span>

        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="block text-sm font-semibold leading-snug break-words text-[#10579F] dark:text-sky-50">
            {label}
          </span>
          <span className="block text-xs leading-relaxed break-words text-slate-600 dark:text-slate-400">
            {description}
          </span>
        </span>
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
        <div className="max-w-md space-y-2">
          <label htmlFor="roleId" className={mbokaLabelClassName}>
            Rôle
          </label>
          <MbokaSelect
            id="roleId"
            name="roleId"
            value={selectedRoleId}
            onValueChange={setSelectedRoleId}
            options={roleOptions}
            placeholder="Sélectionner un rôle"
          />
        </div>

        {selectedRole?.description ? (
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {selectedRole.description}
          </p>
        ) : null}

        <p className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:border-sky-900 dark:bg-slate-800/50 dark:text-slate-400">
          Les changements sont enregistrés immédiatement. Les sessions déjà ouvertes conservent leurs
          habilitations jusqu&apos;à la prochaine connexion.
        </p>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")}>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
            Grille des permissions
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Cochez les actions autorisées pour le rôle sélectionné.
          </p>
        </div>

        <div className="space-y-8">
          {permissionGroups.map((group) => (
            <div key={group.id} className="space-y-3" data-testid={`permission-group-${group.id}`}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-500 dark:text-sky-400">
                {group.label}
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.permissions.map((permission) => renderPermissionCard(permission))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
