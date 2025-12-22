
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteEvent } from "@/lib/actions/event";
import { MoreHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EventWithVenue } from "./EventCard";

interface CellActionProps {
  data: EventWithVenue;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  const onDelete = async () => {
    if (confirm(`Are you sure you want to delete event "${data.name}"?`)) {
      const result = await deleteEvent(data.id);
      if (result.success) {
        toast.success("Event deleted successfully.");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete event.");
      }
    }
  };
     const { data: session } = useSession();
      const canAddEvent = [
        'TECHNICIAN',
        'ADMIN_TECHNICIAN',
        'LAB_MANAGER',
        'ADMIN'
      ].includes(session?.user?.role || '');

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
        {
          canAddEvent && (
            <DropdownMenuItem onClick={() => router.push(`/events/${data.id}`)}>
              Edit
            </DropdownMenuItem>
          )
        }
        <DropdownMenuItem onClick={() => router.push(`/events/${data.id}/view`)}>
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/events/${data.id}/register`)}>
          Register
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {
          canAddEvent && (
            <DropdownMenuItem onClick={onDelete} className="text-red-600 hover:!text-red-600">
              Delete
            </DropdownMenuItem>
          )
        }
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
