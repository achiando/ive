
import { Button } from "@/components/ui/button";
import { getUserById } from "@/lib/actions/user";
import Link from "next/link";
import { UserView, UserWithRelations } from "./_components/UserView";

export default async function UserViewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Invalid user ID</p>
        <Button asChild variant="link">
          <Link href="/users">Go back to all users</Link>
        </Button>
      </div>
    );
  }

  try {
    const userData = await getUserById(id);

    if (!userData) {
      return (
        <div className="text-center">
          <p className="text-lg font-semibold">User not found</p>
          <Button asChild variant="link">
            <Link href="/users">Go back to all users</Link>
          </Button>
        </div>
      );
    }

    return <UserView user={userData as UserWithRelations} />;
  } catch (error) {
    console.error('Error fetching user:', error);
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Error loading user</p>
        <Button asChild variant="link">
          <Link href="/users">Go back to all users</Link>
        </Button>
      </div>
    );
  }
}
