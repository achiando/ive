"use client";

import { useRouter } from "next/navigation";
import { SOPForm } from "./SOPForm";
import { SafetyTestFormValues, SafetyTestWithRelations } from "@/types/safety-test";
import { toast } from "sonner";
import { createSafetyTest, updateSafetyTest } from "@/lib/actions/safety-test";

interface SopFormClientProps {
  initialData?: SafetyTestWithRelations | null;
  isCreating: boolean;
}

export function SopFormClient({ initialData, isCreating }: SopFormClientProps) {
  const router = useRouter();

  const handleSuccess = async (newOrUpdatedTest: SafetyTestWithRelations) => {
    toast.success(`SOP Manual ${isCreating ? "created" : "updated"} successfully!`);
    router.push(`/dashboard/sop/${newOrUpdatedTest.id}/view`); // Redirect to view page after save
  };

  const handleCancel = () => {
    if (isCreating) {
      router.push("/dashboard/sop"); // Go back to list if creating
    } else {
      router.push(`/dashboard/sop/${initialData?.id}/view`); // Go back to view page if editing
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
