
"use client";

import { getEventParticipants } from "@/lib/actions/event-participation";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<
  Awaited<ReturnType<typeof getEventParticipants>>[number]
>[] = [
  {
    accessorKey: "user.name",
    header: "Name",
    cell: ({ row }) => {
      const participant = row.original;
      return participant.user 
        ? `${participant.user.firstName || ''} ${participant.user.lastName || ''}`.trim() || "N/A"
        : participant.guestName || "N/A";
    },
  },
  {
    accessorKey: "user.email",
    header: "Email",
    cell: ({ row }) => {
      const participant = row.original;
      return participant.user?.email || participant.guestEmail || "N/A";
    },
  },
  {
    accessorKey: "joinedAt",
    header: "Registered At",
    cell: ({ row }) => {
      return new Date(row.original.joinedAt).toLocaleString();
    },
  },
  {
    header: "Type",
    cell: ({ row }) => {
      return row.original.userId ? "User" : "Guest";
    },
  },
];
