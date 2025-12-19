import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookingAnalytics } from "../_components/BookingAnalytics";
import { UserRole } from "@prisma/client";

export default async function BookingAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role as UserRole;

  // Authorization check: Only Admins and Lab Managers can view analytics
  if (![UserRole.ADMIN, UserRole.LAB_MANAGER].includes(userRole)) {
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
        <BookingAnalytics />
      </div>
    </div>
  );
}
