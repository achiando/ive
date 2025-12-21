import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSafetyTestById } from "@/lib/actions/safety-test";
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
      <div className="flex items-center">
       
        <h1 className="text-2xl font-bold">
          {isCreating ? "Create New SOP Manual" : `Edit SOP Manual: ${safetyTest?.name}`}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>SOP Manual Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SopFormClient initialData={safetyTest} isCreating={isCreating} />
        </CardContent>
      </Card>
    </div>
  );
}
