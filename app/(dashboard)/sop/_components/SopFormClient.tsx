"use client";

import { createSafetyTest, updateSafetyTest } from "@/lib/actions/safety-test";
import { SafetyTestFormValues, SafetyTestWithRelations } from "@/types/safety-test";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SOPForm } from "./SOPForm";

interface SopFormClientProps {
  initialData?: SafetyTestWithRelations | null;
  isCreating: boolean;
}

export function SopFormClient({ initialData, isCreating }: SopFormClientProps) {
  const router = useRouter();

  const handleSuccess = async (newOrUpdatedTest: SafetyTestWithRelations) => {
    toast.success(`SOP Manual ${isCreating ? "created" : "updated"} successfully!`);
    router.push(`/sop/${newOrUpdatedTest.id}/view`); // Redirect to view page after save
  };

  const handleCancel = () => {
    if (isCreating) {
      router.push("/sop"); // Go back to list if creating
    } else {
      router.push(`/sop/${initialData?.id}/view`); // Go back to view page if editing
    }
  };

  const handleSubmit = async (data: SafetyTestFormValues | (SafetyTestFormValues & { id: string })) => {
    if ('id' in data) {
      const { id, ...rest } = data;
      return updateSafetyTest(id, rest);
    } else {
      return createSafetyTest(data);
    }
  };

  return (
    <SOPForm
      initialData={initialData}
      onFormSuccess={handleSuccess}
      onFormCancel={handleCancel}
      onSubmitAction={handleSubmit}
    />
  );
}
