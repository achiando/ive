import { createBooking, getBookingById, updateBooking } from "@/lib/actions/booking";
import { getEquipments } from "@/lib/actions/equipment";
import { checkProjectStatus } from "@/lib/actions/project";
import { authOptions } from "@/lib/auth";
import { BookingDetails } from "@/types/booking";
import { ProjectStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ProjectBookingForm, { BookingFormData } from "../_components/ProjectBookingForm";

interface BookingPageProps {
  params: {
    id: string;
  };
  searchParams: {
    projectId?: string; 
  };
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { id } = params;
  const { projectId: searchProjectId } = searchParams;

  const isNewBooking = id === 'new';
  let initialData: BookingDetails | undefined = undefined;
  let projectId: string | null | undefined = searchProjectId;

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
    projectId = booking.projectId;
  }

  if (projectId) {
    const projectStatus = await checkProjectStatus(projectId);
    if (projectStatus.status !== ProjectStatus.APPROVED) {
      return (
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold">Project Not Approved</h1>
          <p className="text-muted-foreground">
            This project is currently not approved. Bookings can only be made for approved projects.
          </p>
          <p className="text-muted-foreground">
            Current project status: <strong>{projectStatus.status}</strong>
          </p>
        </div>
      );
    }
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  const equipmentList = await getEquipments();

  const handleSubmitSuccess = async (bookingId?: string) => {
    "use server";
    if (isNewBooking && bookingId) {
      redirect(`/consumables/allocations/new?bookingId=${bookingId}`);
    } else {
      // Return a special flag to indicate the form should navigate back
      return { navigateBack: true };
    }
  };

  const handleFormSubmit = async (formData: BookingFormData) => {
    "use server";
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      if (isNewBooking) {
        const newBooking = await createBooking({
          ...formData,
          userId,
        });
        return { bookingId: newBooking.id };
      } else {
        await updateBooking(id, {
          ...formData,
        });
        return { success: true };
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <ProjectBookingForm
        bookingId={isNewBooking ? undefined : id}
        initialData={initialData}
        onSuccess={handleSubmitSuccess}
        equipmentList={equipmentList}
        userId={userId}
        onSubmit={handleFormSubmit}
        projectId={searchProjectId} 
      />
    </div>
  );
}
