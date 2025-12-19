import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SopPageClient } from "./_components/SopPageClient";
import { getSafetyTests } from "@/lib/actions/safety-test";

export default async function SopPage() {
  const safetyTests = await getSafetyTests();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          SOP Manuals
        </h1>
        <div className="flex justify-end items-center py-4">
          <div className='flex space-x-2'>
            <Button asChild>
              <Link href="/dashboard/sop/new">
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add SOP Manual
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <SopPageClient initialSafetyTests={safetyTests} />
    </div>
  );
}
