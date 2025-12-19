import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBookings, updateBookingStatus, deleteBooking } from "@/lib/actions/booking";
import { BookingsPageClient } from "./_components/BookingsPageClient";
import { BookingStatus } from "@/types/booking"; // Import BookingStatus enum
import { revalidatePath } from "next/cache";

interface BookingsPageProps {
  searchParams: {
    status?: BookingStatus;
    search?: string;
    page?: string;
    pageSize?: string;
  };
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const page = parseInt(searchParams.page || '1');
  const pageSize = parseInt(searchParams.pageSize || '10');
  const status = searchParams.status || undefined;
  const searchQuery = searchParams.search || undefined;

  const { data: bookings, total } = await getBookings({
    userId: session.user.id, // Fetch bookings for the current user
    status,
    searchQuery,
    page,
    pageSize,
  });

  const handleUpdateBookingStatus = async (id: string, newStatus: BookingStatus, reason?: string) => {
    "use server";
    const result = await updateBookingStatus(id, newStatus, reason);
    if (!result.success) {
      console.error("Failed to update booking status:", result.message);
    }
    revalidatePath('/dashboard/bookings');
    return result;
  };

  const handleDeleteBooking = async (id: string) => {
    "use server";
    try {
      await deleteBooking(id);
      revalidatePath('/dashboard/bookings');
    } catch (error) {
      console.error("Failed to delete booking:", error);
      throw error;
    }
  };

  return (
    <BookingsPageClient
      bookings={bookings}
      onUpdateBookingStatus={handleUpdateBookingStatus}
      onDeleteBooking={handleDeleteBooking}
    />
  );
}
