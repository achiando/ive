"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PlusCircle, Table, LayoutGrid } from "lucide-react"; // Added LayoutGrid for grid view toggle
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingDetails, BookingStatus } from "@/types/booking";
import { columns } from "./columns";
import { BookingList } from "./BookingList"; // Import BookingList

interface BookingsPageClientProps {
  bookings: BookingDetails[];
  onUpdateBookingStatus: (id: string, status: BookingStatus, reason?: string) => Promise<{ success: boolean; message?: string }>;
  onDeleteBooking: (id: string) => Promise<void>;
}

export function BookingsPageClient({
  bookings,
  onUpdateBookingStatus,
  onDeleteBooking,
}: BookingsPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");
  const [filterByTime, setFilterByTime] = useState<string | "all">("all"); // 'all', 'past', 'upcoming'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); // State for view mode

  const isLoading = !bookings;

  const filteredBookings = useMemo(() => {
    let currentBookings = bookings;

    if (searchTerm) {
      currentBookings = currentBookings.filter(
        (booking) =>
          booking.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.project?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      currentBookings = currentBookings.filter((booking) => booking.status === selectedStatus);
    }

    if (filterByTime === "past") {
      currentBookings = currentBookings.filter((booking) => booking.isPast);
    } else if (filterByTime === "upcoming") {
      currentBookings = currentBookings.filter((booking) => booking.isUpcoming);
    }

    return currentBookings;
  }, [bookings, searchTerm, selectedStatus, filterByTime]);

  const renderFilters = (showSearchInput: boolean) => (
    <Fragment>
      {showSearchInput && (
        <Input
          placeholder="Search by purpose, equipment, project, user..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="flex space-x-2">
        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={(value: string | "all") => setSelectedStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(BookingStatus).map(status => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Filter */}
        <Select value={filterByTime} onValueChange={(value: string | "all") => setFilterByTime(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Times</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Fragment>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Bookings</h1>
          <p className="text-muted-foreground">
            Manage and track all equipment bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/dashboard/bookings/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns(onUpdateBookingStatus, onDeleteBooking)}
          data={filteredBookings}
          filterColumnId="purpose" 
          filterColumnPlaceholder="Filter by purpose..." 
        >
          {renderFilters(true)}
        </DataTable>
      ) : (
        <BookingList bookings={filteredBookings} />
      )}
    </div>
  );
}