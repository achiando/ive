import { deleteBooking, getBookingAnalytics, getBookings, updateBookingStatus } from "@/lib/actions/booking";
import { authOptions } from "@/lib/auth";
import { BookingAnalyticsData, BookingStatus } from "@/types/booking"; // Import BookingStatus enum and BookingAnalyticsData
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BookingsPageClient } from "./_components/BookingsPageClient";

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
  const searchPage = await searchParams;

  const page = parseInt(searchPage.page || '1');
  const pageSize = parseInt(searchPage.pageSize || '10');
  const status = searchPage.status || undefined;
  const searchQuery = searchPage.search || undefined;

  const { data: bookings, total } = await getBookings({
    status,
    searchQuery,
    page,
    pageSize,
  });


  const analyticsData: BookingAnalyticsData = await getBookingAnalytics();

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
      analyticsData={analyticsData} // Pass analytics data
    />
  );
}
