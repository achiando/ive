import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEvents } from "@/lib/actions/event";
import { getEquipment } from "@/lib/actions/equipment";
import { getUserSelections } from "@/lib/actions/user";
import { PendingPageClient } from "./_components/pending-page-client";
import { RegistrationStatus } from "@prisma/client";

export default async function PendingPage() {
  const session = await auth();

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
    getEquipment(),
    getUserSelections(session.user.id),
  ]);

  return (
    <PendingPageClient
      initialEvents={events}
      initialEquipment={equipment}
      initialUserSelections={userSelections}
    />
  );
}
