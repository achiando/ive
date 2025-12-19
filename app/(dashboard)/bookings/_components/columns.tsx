"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"

import { BookingDetails, BookingStatus } from "@/types/booking"
import { CellAction } from "./CellAction";
import { Badge } from "@/components/ui/badge"

export const columns = (
  onUpdateBookingStatus: (id: string, status: BookingStatus, reason?: string) => Promise<{ success: boolean; message?: string }>,
  onDeleteBooking: (id: string) => Promise<void>,
): ColumnDef<BookingDetails>[] => {
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
      cell: ({ row }) => row.original.equipment.name,
    },
    {
      accessorKey: "purpose",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Purpose
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "project.title",
      header: "Project",
      cell: ({ row }) => row.original.project?.title || 'N/A',
    },
    {
      accessorKey: "user.name",
      header: "Booked By",
      cell: ({ row }) => row.original.user?.name || 'N/A',
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
      cell: ({ row }) => format(new Date(row.getValue("startDate")), "PPP - h:mm a"),
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            End Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => format(new Date(row.getValue("endDate")), "PPP - h:mm a"),
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
        const status: BookingStatus = row.getValue("status");
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        if (status === BookingStatus.APPROVED || status === BookingStatus.COMPLETED || status === BookingStatus.CHECKED_OUT || status === BookingStatus.RETURNED) variant = "default";
        if (status === BookingStatus.REJECTED || status === BookingStatus.CANCELLED || status === BookingStatus.OVERDUE) variant = "destructive";
        return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <CellAction
          data={row.original}
          onUpdateBookingStatus={onUpdateBookingStatus}
          onDeleteBooking={onDeleteBooking}
        />
      ),
    },
  ];
};
