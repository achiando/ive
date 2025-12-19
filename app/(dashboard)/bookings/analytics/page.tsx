import { getBookingAnalytics } from "@/lib/actions/booking";
import { authOptions } from "@/lib/auth";
import { BookingAnalyticsData } from "@/types/booking";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BookingAnalytics } from "../_components/BookingAnalytics";

export default async function BookingAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role as UserRole;
const analyticsData: BookingAnalyticsData = await getBookingAnalytics();

  // Authorization check: Only Admins and Lab Managers can view analytics
  const allowedRoles = [UserRole.ADMIN, UserRole.LAB_MANAGER] as const;
  if (!(allowedRoles as readonly string[]).includes(userRole)) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view booking analytics.</p>
      </div>
    );
    }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
             <BookingAnalytics data={analyticsData} />
      </div>
    </div>
  );
}
