"use client";

import { UserRole } from "@prisma/client";
import { AdminDashboard } from "./AdminDashboard";
import { StudentDashboard } from "./StudentDashboard";
import { TechnicianDashboard } from "./TechnicianDashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  userRole: UserRole;
  dashboardData: any; // This will be the specific data type for each dashboard
  isLoading: boolean;
  currentUserId: string;
}

export function Dashboard({ userRole, dashboardData, isLoading, currentUserId }: DashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="space-y-4 lg:col-span-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4 lg:col-span-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  switch (userRole) {
    case UserRole.ADMIN:
    case UserRole.LAB_MANAGER:
      return <AdminDashboard dashboardData={dashboardData} isLoading={isLoading} />;
    case UserRole.STUDENT:
    case UserRole.LECTURER:
    case UserRole.FACULTY:
      return <StudentDashboard dashboardData={dashboardData} isLoading={isLoading} />;
    case UserRole.TECHNICIAN:
    case UserRole.ADMIN_TECHNICIAN:
      return <TechnicianDashboard dashboardData={dashboardData} isLoading={isLoading} currentUserId={currentUserId} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <h2 className="text-2xl font-bold text-gray-700">Welcome to your Dashboard!</h2>
          <p className="text-muted-foreground mt-2">Your specific dashboard content will appear here.</p>
        </div>
      );
  }
}
