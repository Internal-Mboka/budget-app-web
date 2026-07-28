import { RevenuesPlanning } from "@/components/organisms/revenues-planning";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { mapTransactionsToBookingRecords } from "@/lib/revenues/conflicts";
import { prisma } from "@/lib/prisma";

export default async function RevenuesPlanningPage() {
  const revenues = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      revenueCategory: { in: ["STUDIO_SESSION", "LOCATION_VEHICULE"] },
      status: { not: "LITIGE_ANNULE" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      status: true,
      revenueCategory: true,
      metadata: true,
      client: { select: { name: true } },
    },
  });

  const bookings = mapTransactionsToBookingRecords(revenues);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Planning des ressources"
        description="Vue synoptique des sessions studio et locations véhicules, avec code couleur par statut financier."
      />

      <RevenuesPlanning bookings={bookings} />
    </div>
  );
}
