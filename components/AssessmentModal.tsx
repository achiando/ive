"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AssessmentBot } from "@/components/AssessmentBot";
import { recordSafetyTestAttempt } from "@/lib/actions/safety-test"; // Assuming this is the correct path

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  safetyTestId?: string;
  equipmentId?: string;
  manualUrl?: string | null;
  documentTitle: string;
}

export function AssessmentModal({
  isOpen,
  onClose,
  safetyTestId,
  equipmentId,
  manualUrl,
  documentTitle,
}: AssessmentModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Safety Assessment Required</DialogTitle>
          <DialogDescription>
            Please complete this safety assessment to proceed. This window cannot be closed until the assessment is finished.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0">
          <AssessmentBot
            safetyTestId={safetyTestId}
            equipmentId={equipmentId}
            manualUrl={manualUrl}
            documentTitle={documentTitle}
            onRecordAttempt={recordSafetyTestAttempt}
            open={true} // Always open when in the modal
            onComplete={() => onClose()} // This is now the only way to close the modal
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
