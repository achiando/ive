"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SafetyTestWithRelations } from "@/types/safety-test"
import { UserRole } from "@prisma/client"
import { Copy, Edit, FileText, MoreHorizontal, Trash } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CellActionProps {
  data: SafetyTestWithRelations;
  onEdit: (safetyTest: SafetyTestWithRelations) => void;
  onDelete: (id: string) => void;
}

const isAdminOrManager = (role: UserRole): boolean => {
  const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN];
  return adminRoles.includes(role as any);
};

export const CellAction: React.FC<CellActionProps> = ({ data, onEdit, onDelete }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;
  const canManageSOPs = isAdminOrManager(userRole);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("SOP ID copied to clipboard.");
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
        <DropdownMenuItem onClick={() => onCopy(data.id)}>
          <Copy className="mr-2 h-4 w-4" /> Copy ID
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/sop/${data.id}/view`}>
            <FileText className="mr-2 h-4 w-4" /> View
          </Link>
        </DropdownMenuItem>
        {canManageSOPs && (
          <>
            <DropdownMenuItem onClick={() => onEdit(data)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(data.id)} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
