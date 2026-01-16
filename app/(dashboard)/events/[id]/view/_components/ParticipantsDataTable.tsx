"use client";

import { DataTable } from "@/components/ui/data-table";
import { getEventParticipants } from "@/lib/actions/event-participation";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { getColumns } from "./columns";

type ParticipantsDataTableProps = {
  data: Awaited<ReturnType<typeof getEventParticipants>>;
  
};

export function ParticipantsDataTable({ data }: ParticipantsDataTableProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  // Return null or a loading state if session is not yet available
  if (!session || !userRole) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  const columns = getColumns(userRole);

  // Check if the email column, which is used for filtering, exists.
  const hasEmailColumn = columns.some(col => col.id === 'email');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Participants</h2>
      <DataTable 
        columns={getColumns(userRole as UserRole)}
        data={data} 
        filterColumnId={hasEmailColumn ? "email" : undefined} 
        filterColumnPlaceholder={hasEmailColumn ? "Search by email..." : undefined}
      />
    </div>
  );
}
