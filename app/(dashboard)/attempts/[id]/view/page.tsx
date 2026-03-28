import { Button } from "@/components/ui/button";
import { getSafetyTestAttemptById, getSafetyTestAttemptsByUserId } from "@/lib/actions/safety-test";
import { SafetyTestAttemptWithRelations } from "@/types/safety-test";
import Link from "next/link";
import { AttemptView } from "./_components/AttemptView";

export default async function AttemptViewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Invalid attempt ID</p>
        <Button asChild variant="link">
          <Link href="/attempts">Go back to all attempts</Link>
        </Button>
      </div>
    );
  }

  let attemptData;
  let userAttempts: SafetyTestAttemptWithRelations[] = [];
  let error = null;

  try {
    attemptData = await getSafetyTestAttemptById(id);
    if (attemptData) {
      userAttempts = await getSafetyTestAttemptsByUserId(attemptData.userId);
    }
  } catch (err) {
    error = err;
    console.error('Error fetching attempt:', err);
  }

  // Handle errors outside try/catch
  if (error) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Error loading attempt</p>
        <Button asChild variant="link">
          <Link href="/attempts">Go back to all attempts</Link>
        </Button>
      </div>
    );
  }

  if (!attemptData) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Attempt not found</p>
        <Button asChild variant="link">
          <Link href="/attempts">Go back to all attempts</Link>
        </Button>
      </div>
    );
  }

  return (
    <AttemptView
      attempt={attemptData as SafetyTestAttemptWithRelations}
      userAttempts={userAttempts}
    />
  );
}
