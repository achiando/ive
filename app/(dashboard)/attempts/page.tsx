import { getSafetyTestAttempts } from "@/lib/actions/safety-test";
import { AttemptsPageClient } from "./_components/AttemptsPageClient";

export default async function AttemptsPage() {
  const attempts = await getSafetyTestAttempts();

  return (
    <AttemptsPageClient
      attempts={attempts}
    />
  );
}
