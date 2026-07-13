import Image from "next/image";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { getCurrentUser, normalizeRole, setSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PLATFORM_USERS = 8;
const ROLE_OPTIONS = [
  "PDG",
  "COMPTABLE",
  "DG",
  "DIRECTEUR TECHNIQUE",
  "OBSERVATEUR",
] as const;

const UNIQUE_LEADERSHIP_ROLES: UserRole[] = [
  UserRole.PDG,
  UserRole.COMPTABLE,
  UserRole.DG,
  UserRole.DIRECTEUR_TECHNIQUE,
];

function getFormStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis"),
  email: z.string().trim().email("Adresse mail invalide"),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replaceAll(/[^\d+]/g, ""))
    .refine((value) => value.length >= 6, "Numero invalide"),
  role: z.enum(ROLE_OPTIONS),
});

async function handleSignup(formData: FormData) {
  "use server";

  const parsed = signupSchema.safeParse({
    name: getFormStringValue(formData.get("name")),
    email: getFormStringValue(formData.get("email")),
    phone: getFormStringValue(formData.get("phone")),
    role: getFormStringValue(formData.get("role")),
  });

  if (!parsed.success) {
    redirect("/?error=signup");
  }

  const { name, email, phone, role } = parsed.data;
  const normalizedRole = normalizeRole(role);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      await setSessionUser(existingUser.id);
      redirect("/dashboard");
    }

    const totalUsers = await prisma.user.count();

    if (totalUsers >= MAX_PLATFORM_USERS) {
      redirect("/?error=user-limit");
    }

    if (UNIQUE_LEADERSHIP_ROLES.includes(normalizedRole)) {
      const roleOwner = await prisma.user.findFirst({
        where: {
          role: normalizedRole,
        },
        select: {
          email: true,
        },
      });

      if (roleOwner && roleOwner.email !== email) {
        redirect("/?error=role-taken");
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role: normalizedRole,
      },
      select: { id: true },
    });

    await setSessionUser(user.id);
  } catch (error) {
    console.error("Signup failed", error);

    if (error instanceof Error) {
      const normalizedMessage = error.message.toLowerCase();

      // Handle DB connection/authentication issues first.
      if (
        normalizedMessage.includes("authentication failed") ||
        normalizedMessage.includes("password authentication failed") ||
        normalizedMessage.includes("can't reach database server") ||
        normalizedMessage.includes("database_url") ||
        normalizedMessage.includes("econnrefused") ||
        normalizedMessage.includes("p1000") ||
        normalizedMessage.includes("p1001")
      ) {
        redirect("/?error=db-connection");
      }

      if (normalizedMessage.includes("userrole")) {
        redirect("/?error=role-schema");
      }

      // Handle unique constraints that can happen in race conditions.
      if (normalizedMessage.includes("unique constraint") || normalizedMessage.includes("p2002")) {
        if (normalizedMessage.includes("user_single") || normalizedMessage.includes("role")) {
          redirect("/?error=role-taken");
        }

        if (normalizedMessage.includes("email")) {
          const existingByEmail = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
          });

          if (existingByEmail) {
            await setSessionUser(existingByEmail.id);
            redirect("/dashboard");
          }
        }
      }

      if (
        normalizedMessage.includes("value too long") ||
        normalizedMessage.includes("invalid input")
      ) {
        redirect("/?error=signup");
      }
    }

    redirect("/?error=server");
  }

  redirect("/dashboard?welcome=1");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_48%,#ffffff_100%)] px-4 py-10 text-[#10579F] sm:px-6 lg:px-8">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-4xl border border-sky-100 bg-white/90 p-6 shadow-[0_20px_60px_rgba(16,87,159,0.10)] backdrop-blur sm:p-8">
          <div className="flex justify-center">
            <Image
              src="/photos/mboka.png"
              alt="Illustration Mboka"
              width={170}
              height={170}
              priority
              className="h-auto w-28 object-contain sm:w-36"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(25%) sepia(94%) saturate(1320%) hue-rotate(179deg) brightness(92%) contrast(92%)",
              }}
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-400">
              Bienvenue
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#10579F]">
              MBOKA BUDGET
            </h1>
          </div>

          <form action={handleSignup} className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#10579F]">
                Nom
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Votre nom complet"
                className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#10579F] focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#10579F]">
                Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nom@exemple.com"
                className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#10579F] focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[#10579F]">
                Numéro
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+243 ..."
                className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#10579F] focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-[#10579F]">
                Poste
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#10579F] focus:bg-white focus:ring-4 focus:ring-sky-100"
                defaultValue="OBSERVATEUR"
              >
                {ROLE_OPTIONS.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-2xl bg-[#10579F] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-[#0d4a87]"
            >
              Entrer
            </button>
          </form>

          {error === "signup" ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
              Verification invalide: complete tous les champs correctement.
            </p>
          ) : null}

          {error === "server" ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs text-rose-700">
              Impossible d&apos;enregistrer les donnees en base pour le moment.
            </p>
          ) : null}

          {error === "user-limit" ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
              Limite atteinte: seulement 8 comptes peuvent exister sur la plateforme.
            </p>
          ) : null}

          {error === "role-taken" ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
              Ce poste est deja attribue a une autre personne (PDG, Comptable, DG ou Directeur technique).
            </p>
          ) : null}

          {error === "role-schema" ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs text-rose-700">
              Les roles ne sont pas encore synchronises en base. Lance la migration avant de continuer.
            </p>
          ) : null}

          {error === "db-connection" ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs text-rose-700">
              La connexion a la base a change. Redemarre le serveur puis reessaie avec la nouvelle DATABASE_URL.
            </p>
          ) : null}

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Connexion et inscription réunies dans une seule interface simple.
          </p>
        </section>
      </main>
    </div>
  );
}
