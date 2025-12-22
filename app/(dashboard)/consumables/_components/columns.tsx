"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef, Row } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useSession } from "@/hooks/useSession"
import { ConsumableWithRelations } from "@/types/consumable"
import { ConsumableCategory } from "@prisma/client"
import { CellAction } from "./cell-action"

export function useConsumableColumns() {
  const { isAdmin } = useSession();

  const columns: ColumnDef<ConsumableWithRelations>[] = [
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
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const category: ConsumableCategory = row.getValue("category");
        return <Badge variant="secondary">{category.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      accessorKey: "currentStock",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Current Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const currentStock: number = row.getValue("currentStock");
        const unit: string = row.original.unit ?? '';
        return `${currentStock} ${unit}`;
      },
    },
    {
      accessorKey: "minimumStock",
      header: "Min Stock",
      cell: ({ row }) => {
        const minimumStock: number = row.getValue("minimumStock");
        const unit: string = row.original.unit ?? '';
        return `${minimumStock} ${unit}`;
      },
    },
    // Admin-only columns
    ...(isAdmin ? [{
      accessorKey: "unitCost",
      header: "Unit Cost",
      cell: ({ row }: { row: Row<ConsumableWithRelations> }) => {
        const unitCost: number | null = row.getValue("unitCost");
        return unitCost ? `$${unitCost.toFixed(2)}` : 'N/A';
      },
    }] : []),
    ...(isAdmin ? [{
      accessorKey: "location",
      header: "Location",
    }] : []),
    ...(isAdmin ? [{
      accessorKey: "supplier",
      header: "Supplier",
    }] : []),
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
    },
  ];

  return columns;
}