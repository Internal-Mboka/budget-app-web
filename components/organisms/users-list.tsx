"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleUserActiveAction, updateUserAction } from "@/lib/actions/users";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
  ROLE_LABELS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roleId: number;
  roleName: string;
};

type RoleOption = {
  id: number;
  name: string;
};

type UsersListProps = {
  users: UserListItem[];
  roles: RoleOption[];
  currentUserId: string;
};

export function UsersList({ users, roles, currentUserId }: UsersListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    setLoadingId(userId);

    const formData = new FormData(event.currentTarget);
    formData.set("userId", userId);

    const result = await updateUserAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setLoadingId(null);
      return;
    }

    toast.success("Utilisateur mis à jour.");
    setEditingId(null);
    router.refresh();
    setLoadingId(null);
  }

  async function handleToggle(userId: string, isActive: boolean) {
    setLoadingId(userId);

    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("isActive", String(isActive));

    const result = await toggleUserActiveAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setLoadingId(null);
      return;
    }

    toast.success(isActive ? "Compte activé." : "Compte bloqué.");
    router.refresh();
    setLoadingId(null);
  }

  return (
    <section className={cn(mbokaPanelClassName, "overflow-hidden p-6 sm:p-8")}>
      <h2 className="text-lg font-semibold text-[#10579F] dark:text-sky-50">Comptes existants</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}.
      </p>

      <div className="mt-6 space-y-4">
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun utilisateur pour le moment.</p>
        ) : (
          users.map((user) => {
            const isEditing = editingId === user.id;
            const isLoading = loadingId === user.id;

            return (
              <article
                key={user.id}
                className="rounded-3xl border border-sky-100 bg-sky-50/40 p-4 dark:border-sky-900 dark:bg-slate-800/40 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#10579F] dark:text-sky-50">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ROLE_LABELS[user.roleName] ?? user.roleName}
                      {" · "}
                      {user.isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Actif</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">Bloqué</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={mbokaButtonOutlineClassName}
                      onClick={() => setEditingId(isEditing ? null : user.id)}
                    >
                      {isEditing ? "Annuler" : "Modifier"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        mbokaButtonOutlineClassName,
                        user.isActive
                          ? "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"
                      )}
                      disabled={isLoading || user.id === currentUserId}
                      onClick={() => handleToggle(user.id, !user.isActive)}
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                      {user.isActive ? "Bloquer" : "Activer"}
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={(event) => handleUpdate(event, user.id)} className="mt-5 space-y-4 border-t border-sky-100 pt-5 dark:border-sky-900">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`firstName-${user.id}`} className={mbokaLabelClassName}>
                          Prénom
                        </label>
                        <input
                          id={`firstName-${user.id}`}
                          name="firstName"
                          defaultValue={user.firstName}
                          required
                          className={cn(mbokaFieldClassName, "min-h-12")}
                        />
                      </div>
                      <div>
                        <label htmlFor={`lastName-${user.id}`} className={mbokaLabelClassName}>
                          Nom
                        </label>
                        <input
                          id={`lastName-${user.id}`}
                          name="lastName"
                          defaultValue={user.lastName}
                          required
                          className={cn(mbokaFieldClassName, "min-h-12")}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor={`email-${user.id}`} className={mbokaLabelClassName}>
                          Email
                        </label>
                        <input
                          id={`email-${user.id}`}
                          name="email"
                          type="email"
                          defaultValue={user.email}
                          required
                          className={cn(mbokaFieldClassName, "min-h-12")}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor={`roleId-${user.id}`} className={mbokaLabelClassName}>
                          Rôle
                        </label>
                        <select
                          id={`roleId-${user.id}`}
                          name="roleId"
                          defaultValue={user.roleId}
                          required
                          className={cn(mbokaFieldClassName, "min-h-12")}
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {ROLE_LABELS[role.name] ?? role.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button type="submit" className={mbokaButtonPrimaryClassName} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </Button>
                  </form>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
