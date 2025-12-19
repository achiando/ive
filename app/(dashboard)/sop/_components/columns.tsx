"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, FileText, Video, Link as LinkIcon, Trash, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { SafetyTestWithRelations } from "@/types/safety-test"
import { UserRole, SafetyTestFrequency, ManualType } from "@prisma/client"
import { format } from "date-fns"
import Link from "next/link"
import { CellAction } from "./cell-action"

export const columns: ColumnDef<SafetyTestWithRelations>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SOP Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <Link href={`/dashboard/sop/${row.original.id}`} className="text-blue-600 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "associatedEquipmentTypes",
    header: "Equipment Types",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.associatedEquipmentTypes.length > 0 ? (
          row.original.associatedEquipmentTypes.map((type, index) => (
            <Badge key={index} variant="secondary">{type}</Badge>
          ))
        ) : (
          <Badge variant="outline">General</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.frequency.replace(/_/g, ' ')}
      </Badge>
    ),
  },
  {
    accessorKey: "manualType",
    header: "Manual Type",
    cell: ({ row }) => {
      const type = row.original.manualType;
      switch (type) {
        case ManualType.PDF:
          return <Badge variant="default" className="bg-red-500 hover:bg-red-500">PDF <FileText className="ml-1 h-3 w-3" /></Badge>;
        case ManualType.VIDEO:
          return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500">Video <Video className="ml-1 h-3 w-3" /></Badge>;
        case ManualType.LINK:
          return <Badge variant="default" className="bg-green-500 hover:bg-green-500">Link <LinkIcon className="ml-1 h-3 w-3" /></Badge>;
        default:
          return <Badge variant="secondary">N/A</Badge>;
      }
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
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      // Access onEdit and onDelete from table meta
      const { onEdit, onDelete } = table.options.meta as {
        onEdit: (safetyTest: SafetyTestWithRelations) => void;
        onDelete: (id: string) => void;
      };
      return <CellAction data={row.original} onEdit={onEdit} onDelete={onDelete} />;
    },
  },
]
