import { getSafetyTests } from "@/lib/actions/safety-test";
import { SopPageClient } from "./_components/SopPageClient";

export default async function SopPage() {
  const safetyTests = await getSafetyTests();

  return (
    <div className="space-y-8">
      <SopPageClient initialSafetyTests={safetyTests} />
    </div>
  );
}
