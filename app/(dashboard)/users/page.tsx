
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getUsers } from "@/lib/actions/user";
import Link from "next/link";
import { columns } from "./_components/columns";
import { NewUsersAnalytics } from "./_components/NewUsersAnalytics";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Users
        </h1>
        <Button asChild>
          <Link href="/users/new">New User</Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <NewUsersAnalytics users={users} isLoading={!users} />
      </Suspense>

      <DataTable 
        columns={columns} 
        data={users}
        filterColumnId="email"
        filterColumnPlaceholder="Filter by email..."
      />
    </div>
  );
}
