"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SafetyTestAttemptWithRelations } from "@/types/safety-test"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { CellAction } from "./cell-action"

export const columns: ColumnDef<SafetyTestAttemptWithRelations>[] = [
  {
    accessorFn: row => `${row.user.firstName} ${row.user.lastName}`,
    id: 'userName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div>
          <div className="font-medium">{user.firstName} {user.lastName}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "safetyTest.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Safety Test
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const safetyTest = row.original.safetyTest;
      return safetyTest?.name || "General Test";
    },
  },
  {
    accessorKey: "equipment.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Equipment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const equipment = row.original.equipment;
      if (!equipment) {
        return <Badge variant="secondary">No Equipment</Badge>;
      }
      return (
        <div>
          <div className="font-medium">{equipment.name}</div>
          {equipment.serialNumber && (
            <div className="text-sm text-muted-foreground">SN: {equipment.serialNumber}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "completedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Completed At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const completedAt = row.getValue("completedAt") as Date;
      const createdAt = row.original.createdAt;
      
      return (
        <div>
          <div className="font-medium">{format(new Date(completedAt), "PPP")}</div>
          <div className="text-sm text-muted-foreground">
            Started: {format(new Date(createdAt), "PPP")}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
