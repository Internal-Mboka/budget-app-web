import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDefaultDashboardPath } from "@/lib/auth/routes";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(getDefaultDashboardPath(session.user));
}
