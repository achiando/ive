"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"

import { MaintenanceWithRelations } from "@/types/maintenance"
import { CellAction } from "./cell-action"; // This will be created next
import { Badge } from "@/components/ui/badge"
import { MaintenanceStatus, MaintenanceType, MaintenanceOrderState } from "@prisma/client"

export const columns = (
  onUpdateStatus: (id: string, status: MaintenanceStatus) => Promise<any>,
  onAssignTechnician: (id: string, assignedToId: string | null) => Promise<any>,
  onGetTechnicians: () => Promise<Array<{ id: string; firstName: string; lastName: string; email: string }>>
): ColumnDef<MaintenanceWithRelations>[] => {
  return [
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
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "equipment.name",
      header: "Equipment",
      cell: ({ row }) => row.original.equipment.name,
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status: MaintenanceStatus = row.getValue("status");
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        if (status === MaintenanceStatus.COMPLETED) variant = "default";
        if (status === MaintenanceStatus.CANCELLED) variant = "destructive";
        return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type: MaintenanceType = row.getValue("type");
        return <Badge variant="outline">{type.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority: 'LOW' | 'MEDIUM' | 'HIGH' = row.getValue("priority");
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        if (priority === 'HIGH') variant = "destructive";
        if (priority === 'MEDIUM') variant = "default";
        return <Badge variant={variant}>{priority}</Badge>;
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Start Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => format(new Date(row.getValue("startDate")), "PPP"),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => {
        const endDate: Date | undefined = row.getValue("endDate");
        return endDate ? format(new Date(endDate), "PPP") : 'N/A';
      },
    },
    {
      accessorKey: "assignedTo.firstName",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        return assignedTo ? `${assignedTo.firstName} ${assignedTo.lastName}` : 'N/A';
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <CellAction
          data={row.original}
          onUpdateStatus={onUpdateStatus}
          onAssignTechnician={onAssignTechnician}
          onGetTechnicians={onGetTechnicians}
        />
      ),
    },
  ];
};
