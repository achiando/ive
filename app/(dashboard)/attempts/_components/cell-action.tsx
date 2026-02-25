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
import { MoreHorizontal, Eye, User, Settings } from "lucide-react"
import type { SafetyTestAttemptWithRelations } from "@/types/safety-test"
import { useRouter } from "next/navigation"

interface CellActionProps {
  data: SafetyTestAttemptWithRelations
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();

  const onViewUser = () => {
    router.push(`/users/${data.userId}/view`);
  };

  const onViewEquipment = () => {
    if (data.equipmentId) {
      router.push(`/equipments/${data.equipmentId}/view`);
    }
  };

  const onViewSafetyTest = () => {
    if (data.safetyTestId) {
      // You might need to create a safety test view page
      // router.push(`/safety-tests/${data.safetyTestId}/view`);
      console.log("View safety test:", data.safetyTestId);
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
        <DropdownMenuItem onClick={onViewUser}>
          <User className="mr-2 h-4 w-4" />
          View User
        </DropdownMenuItem>
        {data.equipmentId && (
          <DropdownMenuItem onClick={onViewEquipment}>
            <Eye className="mr-2 h-4 w-4" />
            View Equipment
          </DropdownMenuItem>
        )}
        {data.safetyTestId && (
          <DropdownMenuItem onClick={onViewSafetyTest}>
            <Settings className="mr-2 h-4 w-4" />
            View Safety Test
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(data.id)}
        >
          Copy attempt ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
