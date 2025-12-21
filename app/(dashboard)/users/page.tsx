// export const dynamic = "force-dynamic";

import { getUsers } from "@/lib/actions/user";
import { UsersPageClient } from "../technicians/_components/UsersPageClient";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <UsersPageClient
      users={users}
    />
  );
}
