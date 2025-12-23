
"use client";

import { DataTable } from "@/components/ui/data-table";
import { getEventParticipants } from "@/lib/actions/event-participation";
import { columns } from "./columns";

type ParticipantsDataTableProps = {
  data: Awaited<ReturnType<typeof getEventParticipants>>;
};

export function ParticipantsDataTable({ data }: ParticipantsDataTableProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Participants</h2>
      <DataTable 
        columns={columns} 
        data={data} 
        filterColumnId="email" 
        filterColumnPlaceholder="Search participants..."
      />
    </div>
  );
}
