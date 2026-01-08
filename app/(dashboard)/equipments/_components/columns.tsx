"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"

import { EquipmentWithRelations } from "@/types/equipment"
import { UserRole } from "@prisma/client"; // Import UserRole
import { CellAction } from "./cell-action"

export const getColumns = (userRole: UserRole): ColumnDef<EquipmentWithRelations>[] => {
  const baseColumns: ColumnDef<EquipmentWithRelations>[] = [
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "name",
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
      accessorKey: "model",
      header: "Model",
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
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      id: 'currentBookings',
      header: "Current Bookings (Today)",
      cell: ({ row }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentBookings = row.original.bookings?.filter(booking => {
          const startDate = new Date(booking.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(booking.endDate);
          endDate.setHours(0, 0, 0, 0);
          return startDate <= today && endDate >= today;
        }).length || 0;
        return currentBookings;
      },
    },
  ];

  if (userRole === UserRole.ADMIN || userRole === UserRole.TECHNICIAN) {
    baseColumns.push(
      {
        accessorKey: "serialNumber",
        header: "Serial Number",
      },
      {
        accessorKey: "dailyCapacity",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Daily Capacity
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Added On
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PPP"),
      },
      {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
      }
    );
  }

  return baseColumns;
};