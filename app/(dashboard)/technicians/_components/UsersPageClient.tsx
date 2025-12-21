"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegistrationStatus, User, UserRole } from "@prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { columns } from "../../users/_components/columns";


interface UsersPageClientProps {
  users: User[];
  statistics: {
    totalTechnicians: number;
    techniciansByRole: { [key in UserRole]?: number };
    techniciansByStatus: { [key in RegistrationStatus]?: number };
  };
}

export function UsersPageClient({ users }: UsersPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<RegistrationStatus | "all">("all");

  const isLoading = !users; // Determine loading state

useEffect(() => {
  const shouldReload = new URLSearchParams(window.location.search).get('reload') === 'true';
  if (shouldReload) {
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl); // Remove the query param
    window.location.reload();
  }
}, []);

  const filteredUsers = useMemo(() => {
    let currentUsers = users;

    // Apply search term filter
    if (searchTerm) {
      currentUsers = currentUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (selectedRole !== "all") {
      currentUsers = currentUsers.filter((user) => user.role === selectedRole);
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      currentUsers = currentUsers.filter((user) => user.status === selectedStatus);
    }

    return currentUsers;
  }, [users, searchTerm, selectedRole, selectedStatus]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technician Management</h1>
          <p className="text-muted-foreground">
            Manage and view statistics for all technician-related roles.
          </p>
        </div>
        <div className="flex justify-end items-center py-4">
          <div className='flex space-x-2'>
            <Link href="/dashboard/users/analytics">
              <Button variant="outline" size="sm">
                View Detailed Reports
              </Button>
            </Link>
            <Button onClick={() => router.push('/dashboard/users/new')}>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New User
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Technicians
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87m-3-12a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTechnicians}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Technicians by Role
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              {Object.entries(statistics.techniciansByRole).map(([role, count]) => (
                <div key={role} className="flex justify-between">
                  <span>{role.replace(/_/g, ' ')}:</span>
                  <Badge variant="secondary">{count || 0}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Technicians by Status
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              {Object.entries(statistics.techniciansByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span>{status.replace(/_/g, ' ')}:</span>
                  <Badge variant="secondary">{count || 0}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredUsers} // Pass filtered data to DataTable
        filterColumnId="email" // Keep for text search if needed, though our custom search handles it
        filterColumnPlaceholder="Filter by email..." // This will be overridden by our custom search
      >
        {/* Role Filter */}
        <Select value={selectedRole} onValueChange={(value: UserRole | "all") => setSelectedRole(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.values(UserRole).map((role) => (
              <SelectItem key={role} value={role}>
                {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={(value: RegistrationStatus | "all") => setSelectedStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(RegistrationStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTable>
    </div>
  );
}
