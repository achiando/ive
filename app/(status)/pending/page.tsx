
import { getEquipments } from "@/lib/actions/equipment";
import { getEvents } from "@/lib/actions/event";
import { getUserSelections } from "@/lib/actions/user";
import { authOptions } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PendingPageClient } from "./_components/pending-page-client";

export default async function PendingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.id) {
    redirect("/auth/login");
  }

  if (session.user.status === RegistrationStatus.APPROVED) {
    redirect("/dashboard");
  }
  
  if (session.user.status === RegistrationStatus.REJECTED) {
    redirect("/rejected");
  }

  if (session.user.status === RegistrationStatus.SUSPENDED) {
    redirect("/suspended");
  }

  // Parallel data fetching
  const [events, equipment, userSelections] = await Promise.all([
    getEvents(),
    getEquipments(),
    getUserSelections(session.user.id),
  ]);

  return (
    <PendingPageClient
    session={session}
      initialEvents={events}
      initialEquipment={equipment}
      initialUserSelections={userSelections}
    />
  );
}
