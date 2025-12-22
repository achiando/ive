import {
  getAdminDashboardData,
  getStudentDashboardData,
  getTechnicianDashboardData,
} from "@/lib/actions/dashboard";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Dashboard } from "./_components/Dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  console.log("session", session?.user?.status);

  if (!session?.user || !session.user.id || !session.user.role) {
    redirect("/login");
  }

  if (session?.user?.status === "PENDING") {
    redirect("/pending");
  }

  const { id: userId, role: userRole } = session.user;
  let dashboardData: any = null;
  let isLoading = false; 
  
  try {
    switch (userRole) {
      case UserRole.ADMIN:
      case UserRole.LAB_MANAGER:
        dashboardData = await getAdminDashboardData();
        break;
      case UserRole.STUDENT:
      case UserRole.LECTURER:
      case UserRole.FACULTY:
      case UserRole.OTHER:
        dashboardData = await getStudentDashboardData(userId);
        break;
      case UserRole.TECHNICIAN:
      case UserRole.ADMIN_TECHNICIAN:
        dashboardData = await getTechnicianDashboardData(userId);
        break;
      default:
        // Handle roles without specific dashboards or show a generic one
        dashboardData = {};
        break;
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Optionally, redirect to an error page or show a user-friendly message
    dashboardData = {}; // Fallback to empty data
  }

  return (
    <Dashboard
      userRole={userRole}
      dashboardData={dashboardData}
      isLoading={isLoading}
      currentUserId={userId}
    />
  );
}
