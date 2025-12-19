import { createBooking, getBookingById, updateBooking } from "@/lib/actions/booking";
import { getEquipments } from "@/lib/actions/equipment";
import { authOptions } from "@/lib/auth";
import { BookingDetails } from "@/types/booking";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ProjectBookingForm, { BookingFormData } from "../_components/ProjectBookingForm"; // Import BookingFormData

interface BookingPageProps {
  params: {
    id: string;
  };
  searchParams: {
    projectId?: string; // Allow projectId to be passed via search params
  };
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { id } = await params;
  const { projectId: searchProjectId } = await searchParams; // Get projectId from search params

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  const isNewBooking = id === 'new';
  let initialData: BookingDetails | undefined = undefined;

  if (!isNewBooking) {
    const booking = await getBookingById(id);
    if (!booking) {
      return (
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold">Booking Not Found</h1>
          <p className="text-muted-foreground">The requested booking could not be found.</p>
        </div>
      );
    }
    initialData = booking;
  }

  const equipmentList = await getEquipments();

  const handleFormSubmit = async (formData: BookingFormData) => {
    "use server"; // Mark as server action
    console.log("handleFormSubmit called with:", { formData, isNewBooking, initialData, userId, searchProjectId });
    try {
      if (isNewBooking) {
        await createBooking({
          ...formData,
          userId,
          projectId: formData.projectId || searchProjectId, // Use projectId from formData or search params
        });
      } else {
        if (!initialData?.id) {
          throw new Error("Booking ID is missing for update.");
        }
        await updateBooking(initialData.id, {
          ...formData,
        });
      }
    } catch (error: any) {
      console.error("Error processing booking in page.tsx:", error);
      throw error; // Re-throw to be caught by the client component
    }
  };

  const handleSubmitSuccess = async () => {
    "use server";
    redirect("/dashboard/bookings");
  };

  return (
    <div className="space-y-8">
      <ProjectBookingForm
        bookingId={isNewBooking ? undefined : id}
        initialData={initialData}
        onSuccess={handleSubmitSuccess}
        equipmentList={equipmentList}
        userId={userId}
        onSubmit={handleFormSubmit} // Pass the server action
        projectId={searchProjectId} // Pass projectId from search params to the form
      />
    </div>
  );
}
