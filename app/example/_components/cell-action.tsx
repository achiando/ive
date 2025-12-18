"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { deleteInvoice } from "@/lib/actions/invoice";
import type { Invoice } from "@prisma/client";

interface CellActionProps {
  data: Invoice;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  const onDelete = async () => {
    if (confirm(`Are you sure you want to delete invoice ${data.id}?`)) {
      const result = await deleteInvoice(data.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(data.id)}>
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/invoices/${data.id}`)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/invoices/${data.id}/view`)}>
          View
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600 hover:!text-red-600">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
