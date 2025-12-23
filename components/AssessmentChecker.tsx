"use client";

import { AssessmentModal } from "@/components/AssessmentModal";
import {
  getRandomAssessmentDetails,
  hasUserTakenAnyAssessment,
} from "@/lib/actions/user-assessment";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface AssessmentDetails {
  safetyTestId?: string;
  equipmentId?: string;
  manualUrl?: string | null;
  documentTitle: string;
}

export function AssessmentChecker() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [assessmentDetails, setAssessmentDetails] =
    useState<AssessmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAssessmentStatus() {
      const allowedRoles: UserRole[] = [
        UserRole.STUDENT,
        UserRole.LECTURER,
        UserRole.TECHNICIAN,
        UserRole.OTHER,
        UserRole.FACULTY,
      ];

      if (
        status === "authenticated" &&
        session?.user?.id &&
        session.user.role &&
        allowedRoles.includes(session.user.role)
      ) {
        setIsLoading(true);
        try {
          const hasTakenAssessment = await hasUserTakenAnyAssessment();
          if (!hasTakenAssessment) {
            const details = await getRandomAssessmentDetails();
            setAssessmentDetails(details);
            setShowModal(true);
          }
        } catch (error) {
          console.error(
            "Failed to check assessment status or get random details:",
            error
          );
        } finally {
          setIsLoading(false);
        }
      } else if (
        status === "unauthenticated" ||
        (session?.user?.role && !allowedRoles.includes(session.user.role))
      ) {
        setIsLoading(false);
      }
    }

    checkAssessmentStatus();
  }, [status, session?.user?.id, session?.user?.role]); 

  if (isLoading || status === "loading") {
    return null; // Or a loading spinner if desired
  }

  return (
    <>
      {assessmentDetails && (
        <AssessmentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          safetyTestId={assessmentDetails.safetyTestId}
          equipmentId={assessmentDetails.equipmentId}
          manualUrl={assessmentDetails.manualUrl}
          documentTitle={assessmentDetails.documentTitle}
        />
      )}
    </>
  );
}
