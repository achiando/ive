
"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { User } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import { CellAction } from "./cell-action"

export type UserWithCounts = User & {
  _count: {
    projectMemberships: number;
    equipmentBookings: number;
  };
};

export const columns: ColumnDef<UserWithCounts>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "User ID",
  },
  {
    accessorFn: row => `${row.firstName} ${row.lastName}`,
    id: 'fullName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: 'projects',
    header: "Projects",
    cell: ({ row }) => row.original._count.projectMemberships,
  },
  {
    id: 'bookings',
    header: "Bookings",
    cell: ({ row }) => row.original._count.equipmentBookings,
  },
  {
    accessorKey: "createdAt",
    header: "Date Joined",
    cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PPP"),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
