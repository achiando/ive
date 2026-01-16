"use client";

import { getEventParticipants } from "@/lib/actions/event-participation";
import { UserRole } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

type Participant = Awaited<ReturnType<typeof getEventParticipants>>[number];

const allColumns: ColumnDef<Participant>[] = [
  {
    id: "name",
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
    id: "email",
    accessorFn: (row) => row.user?.email || row.guestEmail,
    header: "Email",
    cell: ({ row }) => {
      const participant = row.original;
      return participant.user?.email || participant.guestEmail || "N/A";
    },
  },
  {
    id: "joinedAt",
    accessorKey: "joinedAt",
    header: "Registered At",
    cell: ({ row }) => {
      return new Date(row.original.joinedAt).toLocaleString();
    },
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => {
      return row.original.userId ? "User" : "Guest";
    },
  },
];

export const getColumns = (userRole: UserRole): ColumnDef<Participant>[] => {
  const isAdmin =
    userRole === UserRole.ADMIN ||
    userRole === UserRole.TECHNICIAN ||
    userRole === UserRole.LAB_MANAGER ||
    userRole === UserRole.ADMIN_TECHNICIAN;

  if (isAdmin) {
    return allColumns;
  }

  // For non-admins, only show the name column
  return allColumns.filter(column => column.id === 'name');
};
