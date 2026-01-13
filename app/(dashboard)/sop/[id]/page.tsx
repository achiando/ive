import { Button } from "@/components/ui/button";
import { getSafetyTestById } from "@/lib/actions/safety-test";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { SopFormClient } from "../_components/SopFormClient"; // Import the new client component

interface SopFormPageProps {
  params: {
    id: string;
  };
}

export default async function SopFormPage({ params }: SopFormPageProps) {
  const { id } = await params;
  const isCreating = id === "new";
  let safetyTest = null;

  if (!isCreating) {
    safetyTest = await getSafetyTestById(id);
    if (!safetyTest) {
      notFound();
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-2">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isCreating ? "Create New SOP Manual" : `Edit SOP Manual: ${safetyTest?.name}`}
        </h1>
      </div>
     

      
      <SopFormClient initialData={safetyTest} isCreating={isCreating} />
       
    </div>
  );
}
