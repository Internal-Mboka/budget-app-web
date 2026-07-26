"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/atoms/password-input";
import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createUserAction,
  toggleUserActiveAction,
  updateUserAction,
} from "@/lib/actions/users";
import { adminResetPasswordAction } from "@/lib/actions/password";
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

type UsersManagementProps = {
  initialUsers: UserListItem[];
  roles: RoleOption[];
  currentUserId: string;
};

function sortUsers(users: UserListItem[]) {
  return [...users].sort((a, b) =>
    `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
  );
}

function buildRoleOptions(roles: RoleOption[]) {
  return roles.map((role) => ({
    value: String(role.id),
    label: ROLE_LABELS[role.name] ?? role.name,
  }));
}

export function UsersManagement({ initialUsers, roles, currentUserId }: UsersManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const defaultRoleId = String(
    roles.find((role) => role.name === "OBSERVATEUR")?.id ?? roles[0]?.id ?? ""
  );
  const [createRoleId, setCreateRoleId] = useState(defaultRoleId);
  const [editRoleId, setEditRoleId] = useState(defaultRoleId);
  const roleOptions = buildRoleOptions(roles);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  function getRoleName(roleId: number) {
    return roles.find((role) => role.id === roleId)?.name ?? "";
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("roleId", createRoleId);

    if (!createRoleId) {
      toast.error("Veuillez sélectionner un rôle.");
      setIsCreating(false);
      return;
    }

    const roleId = Number(createRoleId);
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticUser: UserListItem = {
      id: tempId,
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      isActive: true,
      roleId,
      roleName: getRoleName(roleId),
    };

    setUsers((current) => sortUsers([...current, optimisticUser]));

    try {
      const result = await createUserAction(formData);

      if (!result.success) {
        setUsers((current) => current.filter((user) => user.id !== tempId));
        toast.error(result.error);
        return;
      }

      if (result.user) {
        setUsers((current) =>
          sortUsers([...current.filter((user) => user.id !== tempId), result.user!])
        );
      }

      toast.success("Utilisateur créé avec succès.");
      form.reset();
      setCreateRoleId(defaultRoleId);
      router.refresh();
    } catch {
      setUsers((current) => current.filter((user) => user.id !== tempId));
      toast.error("Erreur serveur. Réessayez dans quelques instants.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    setPendingUserId(userId);

    const formData = new FormData(event.currentTarget);
    formData.set("userId", userId);
    formData.set("roleId", editRoleId);

    const roleId = Number(editRoleId);
    const previousUsers = users;
    const optimisticUser: UserListItem = {
      id: userId,
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      isActive: users.find((user) => user.id === userId)?.isActive ?? true,
      roleId,
      roleName: getRoleName(roleId),
    };

    setUsers((current) => sortUsers(current.map((user) => (user.id === userId ? optimisticUser : user))));

    try {
      const result = await updateUserAction(formData);

      if (!result.success) {
        setUsers(previousUsers);
        toast.error(result.error);
        return;
      }

      toast.success("Utilisateur mis à jour.");
      setEditingId(null);
      router.refresh();
    } catch {
      setUsers(previousUsers);
      toast.error("Erreur serveur. Réessayez dans quelques instants.");
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleToggle(userId: string, isActive: boolean) {
    setPendingUserId(userId);

    const previousUsers = users;
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, isActive } : user))
    );

    try {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("isActive", String(isActive));

      const result = await toggleUserActiveAction(formData);

      if (!result.success) {
        setUsers(previousUsers);
        toast.error(result.error);
        return;
      }

      toast.success(isActive ? "Compte activé." : "Compte bloqué.");
      router.refresh();
    } catch {
      setUsers(previousUsers);
      toast.error("Erreur serveur. Réessayez dans quelques instants.");
    } finally {
      setPendingUserId(null);
    }
  }

  function startEditing(user: UserListItem) {
    setEditingId(user.id);
    setResetPasswordId(null);
    setEditRoleId(String(user.roleId));
  }

  async function handleAdminReset(event: React.FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    setPendingUserId(userId);

    const formData = new FormData(event.currentTarget);
    formData.set("userId", userId);

    try {
      const result = await adminResetPasswordAction(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Mot de passe réinitialisé. L'utilisateur devra le changer à la prochaine connexion.");
      setResetPasswordId(null);
      router.refresh();
    } catch {
      toast.error("Erreur serveur. Réessayez dans quelques instants.");
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className={cn(mbokaPanelClassName, "p-6 sm:p-8")}>
        <h2 className="text-lg font-semibold text-[#10579F] dark:text-sky-50">Nouveau compte</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Créez un utilisateur et assignez-lui un rôle.
        </p>

        <form onSubmit={handleCreate} className="mt-6 space-y-5">
          <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="firstName" className={mbokaLabelClassName}>
                Prénom
              </FieldLabel>
              <Input
                id="firstName"
                name="firstName"
                required
                className={cn(mbokaFieldClassName, "h-auto min-h-12")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName" className={mbokaLabelClassName}>
                Nom
              </FieldLabel>
              <Input
                id="lastName"
                name="lastName"
                required
                className={cn(mbokaFieldClassName, "h-auto min-h-12")}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="email" className={mbokaLabelClassName}>
                Email
              </FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nom@exemple.com"
                className={cn(mbokaFieldClassName, "h-auto min-h-12")}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="password" className={mbokaLabelClassName}>
                Mot de passe temporaire
              </FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                required
                placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="roleId" className={mbokaLabelClassName}>
                Rôle
              </FieldLabel>
              <MbokaSelect
                id="roleId"
                name="roleId"
                value={createRoleId}
                onValueChange={setCreateRoleId}
                options={roleOptions}
                required
              />
            </Field>
          </FieldGroup>

          <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer l'utilisateur"
            )}
          </button>
        </form>
      </section>

      <section className={cn(mbokaPanelClassName, "overflow-hidden p-6 sm:p-8")}>
        <h2 className="text-lg font-semibold text-[#10579F] dark:text-sky-50">Comptes existants</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré
          {users.length > 1 ? "s" : ""}.
        </p>

        <div className="mt-6 space-y-4">
          {users.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun utilisateur pour le moment.</p>
          ) : (
            users.map((user) => {
              const isEditing = editingId === user.id;
              const isResettingPassword = resetPasswordId === user.id;
              const isLoading = pendingUserId === user.id;
              const isOptimistic = user.id.startsWith("optimistic-");

              return (
                <article
                  key={user.id}
                  className={cn(
                    "rounded-3xl border border-sky-100 bg-sky-50/40 p-4 transition-opacity sm:p-5 dark:border-sky-900 dark:bg-slate-800/40",
                    isOptimistic && "opacity-70"
                  )}
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
                        {isOptimistic ? (
                          <span className="ml-2 text-sky-500">Enregistrement…</span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={mbokaButtonOutlineClassName}
                        disabled={isOptimistic}
                        onClick={() => (isEditing ? setEditingId(null) : startEditing(user))}
                      >
                        {isEditing ? "Annuler" : "Modifier"}
                      </button>
                      <button
                        type="button"
                        className={mbokaButtonOutlineClassName}
                        disabled={isOptimistic || user.id === currentUserId}
                        onClick={() => {
                          setEditingId(null);
                          setResetPasswordId(isResettingPassword ? null : user.id);
                        }}
                      >
                        {isResettingPassword ? "Annuler" : "Réinitialiser MDP"}
                      </button>
                      <button
                        type="button"
                        className={cn(
                          mbokaButtonOutlineClassName,
                          user.isActive
                            ? "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"
                        )}
                        disabled={isLoading || user.id === currentUserId || isOptimistic}
                        onClick={() => handleToggle(user.id, !user.isActive)}
                      >
                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                        {user.isActive ? "Bloquer" : "Activer"}
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <form
                      onSubmit={(event) => handleUpdate(event, user.id)}
                      className="mt-5 space-y-4 border-t border-sky-100 pt-5 dark:border-sky-900"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor={`firstName-${user.id}`} className={mbokaLabelClassName}>
                            Prénom
                          </label>
                          <Input
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
                          <Input
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
                          <Input
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
                          <MbokaSelect
                            id={`roleId-${user.id}`}
                            name="roleId"
                            value={editRoleId}
                            onValueChange={setEditRoleId}
                            options={roleOptions}
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          "Enregistrer"
                        )}
                      </button>
                    </form>
                  ) : null}

                  {isResettingPassword ? (
                    <form
                      onSubmit={(event) => handleAdminReset(event, user.id)}
                      className="mt-5 space-y-4 border-t border-sky-100 pt-5 dark:border-sky-900"
                    >
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Définissez un mot de passe temporaire. L&apos;utilisateur devra le changer à
                        sa prochaine connexion.
                      </p>
                      <div>
                        <label htmlFor={`resetPassword-${user.id}`} className={mbokaLabelClassName}>
                          Nouveau mot de passe temporaire
                        </label>
                        <PasswordInput
                          id={`resetPassword-${user.id}`}
                          name="newPassword"
                          required
                          placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
                        />
                      </div>
                      <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Réinitialisation...
                          </>
                        ) : (
                          "Confirmer la réinitialisation"
                        )}
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
