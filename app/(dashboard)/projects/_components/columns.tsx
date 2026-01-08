"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProjectWithDetails } from "@/types/project"
import type { ProjectStatus } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import { CellAction } from "./cell-action"

export const columns: ColumnDef<ProjectWithDetails>[] = [
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
    accessorKey: "creator.firstName",
    header: "Creator",
    cell: ({ row }) => {
      const creator = row.original.creator;
      return `${creator.firstName} ${creator.lastName}`;
    },
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
      const status: ProjectStatus = row.getValue("status");
      const getStatusVariantAndClass = (status: ProjectStatus) => {
        switch (status) {
          case 'APPROVED':
            return { variant: 'default' as const, className: '' };
          case 'PENDING':
            return { variant: 'secondary' as const, className: '' };
          case 'REJECTED':
            return { variant: 'destructive' as const, className: '' };
          case 'COMPLETED':
            return { variant: 'secondary' as const, className: 'bg-green-500 text-white' };
          case 'ARCHIVED':
            return { variant: 'outline' as const, className: '' };
          default:
            return { variant: 'outline' as const, className: '' };
        }
      };

      const formatStatus = (status: ProjectStatus) => {
        return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
      };

      const { variant, className } = getStatusVariantAndClass(status);

      return (
        <Badge variant={variant} className={className}>
          {formatStatus(status)}
        </Badge>
      );
    },
  },
  {
    id: 'members',
    header: "Members",
    cell: ({ row }) => row.original.members.length,
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
    cell: ({ row }) => row.original.startDate ? format(new Date(row.original.startDate), "PPP") : "N/A",
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
    cell: ({ row }) => row.original.endDate ? format(new Date(row.original.endDate), "PPP") : "N/A",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PPP"),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
