import Image from "next/image";
import { redirect } from "next/navigation";
import { z } from "zod";

import { normalizeRole, setSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis"),
  email: z.string().trim().email("Adresse mail invalide"),
  phone: z.string().trim().min(6, "Numero invalide"),
  role: z.string().trim().min(2, "Le poste est requis"),
});

async function handleSignup(formData: FormData) {
  "use server";

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect("/?error=signup");
  }

  const { name, email, phone, role } = parsed.data;

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        phone,
        role: normalizeRole(role),
      },
      create: {
        name,
        email,
        phone,
        role: normalizeRole(role),
      },
      select: { id: true },
    });

    await setSessionUser(user.id);
  } catch (error) {
    console.error("Signup failed", error);
    redirect("/?error=server");
  }

  redirect("/dashboard?welcome=1");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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
              <input
                id="role"
                name="role"
                type="text"
                required
                placeholder="Ex: Comptable, Manager..."
                className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#10579F] focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
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

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Connexion et inscription réunies dans une seule interface simple.
          </p>
        </section>
      </main>
    </div>
  );
}
