import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSafetyTestById } from "@/lib/actions/safety-test";
import { notFound } from "next/navigation";
import { SopFormClient } from "../_components/SopFormClient"; // Import the new client component

interface SopFormPageProps {
  params: {
    id: string;
  };
}

export default async function SopFormPage({ params }: SopFormPageProps) {
  const isCreating = params.id === "new";
  let safetyTest = null;

  if (!isCreating) {
    safetyTest = await getSafetyTestById(params.id);
    if (!safetyTest) {
      notFound();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => window.history.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
