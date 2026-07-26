"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { toggleRolePermissionAction } from "@/lib/actions/roles";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
  ROLE_LABELS,
} from "@/lib/design-tokens";
import { getPermissionLabel } from "@/lib/permissions/labels";
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

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-4")}>
        <div className="max-w-sm space-y-2">
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
          <p className="text-sm text-slate-600 dark:text-slate-400">{selectedRole.description}</p>
        ) : null}

        <p className="text-xs text-slate-500 dark:text-slate-500">
          Les changements sont enregistrés immédiatement. Les sessions déjà ouvertes conservent leurs
          habilitations jusqu&apos;à la prochaine connexion.
        </p>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-4")}>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
          Grille des permissions
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {permissions.map((permission) => {
            const checked = activeSlugs.has(permission.slug);
            const isPending = pendingKey === `${selectedRole?.id}:${permission.slug}`;
            const inputId = `permission-${permission.slug}`;

            return (
              <label
                key={permission.id}
                htmlFor={inputId}
                data-testid={`permission-${permission.slug}`}
                className={cn(
                  mbokaFieldClassName,
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition",
                  checked
                    ? "border-sky-200 bg-sky-50/60 dark:border-sky-800 dark:bg-sky-950/20"
                    : "border-sky-100 bg-white dark:border-sky-900 dark:bg-slate-900/40"
                )}
              >
                <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
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

                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-medium text-[#10579F] dark:text-sky-50">
                    {getPermissionLabel(permission.slug, permission.description)}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {permission.slug}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
