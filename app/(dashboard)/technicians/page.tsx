// export const dynamic = "force-dynamic";

import { getUsers, getTechnicianStatistics } from "@/lib/actions/user"; // Import getTechnicianStatistics
import { UsersPageClient } from "../technicians/_components/UsersPageClient";
import { UserRole } from "@prisma/client"; // Import UserRole

export default async function UsersPage() {
  const technicianRoles = [UserRole.TECHNICIAN, UserRole.ADMIN_TECHNICIAN, UserRole.LAB_MANAGER];
  const users = await getUsers(undefined, technicianRoles); // Pass undefined for status, and the technicianRoles
  const statistics = await getTechnicianStatistics(); // Fetch statistics

  return (
    <UsersPageClient
      users={users}
      statistics={statistics} // Pass statistics to UsersPageClient
    />
  );
}
