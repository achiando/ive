"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { columns } from "./columns";
import { NewUsersAnalytics } from "./NewUsersAnalytics";
import { UserRoleStats } from "./UserRoleStats";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { User, UserRole, RegistrationStatus } from "@prisma/client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UsersPageClientProps {
  users: User[];
}

export function UsersPageClient({ users }: UsersPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<RegistrationStatus | "all">("all");

  const isLoading = !users; // Determine loading state

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Users
        </h1>
        <div className="flex justify-end items-center py-4">
          <div className='flex space-x-2'>
            <Link href="/users/analytics">
              <Button variant="outline" size="sm">
                View Detailed Reports
              </Button>
            </Link>
            <Button onClick={() => router.push('/users/new')}>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New User
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 py-4">
        <Input
          placeholder="Search by email, name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex space-x-2">
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserRoleStats 
          users={filteredUsers} 
          isLoading={isLoading} 
          currentMonthUsers={filteredUsers.filter(user => {
            const userDate = new Date(user.createdAt);
            const now = new Date();
            return userDate.getMonth() === now.getMonth() && 
                   userDate.getFullYear() === now.getFullYear();
          }).length}
        />
        <NewUsersAnalytics 
          users={filteredUsers} 
          isLoading={isLoading} 
        />
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
