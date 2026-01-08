"use client";

import { hasUserTakenAnyAssessment } from "@/lib/actions/user-assessment";
import { RegistrationStatus, UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AssessmentChecker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    async function handleSession() {
      // Don't proceed if we're already checking or session isn't ready
      if (isChecking || status === 'loading' || !session?.user) {
        return;
      }

      console.log("Session status:", status);
      console.log("Session data:", session.user);

      // Handle PENDING status first
      if (session.user.status === RegistrationStatus.PENDING) {
        console.log("Redirecting to pending page from AssessmentChecker");
        router.push('/pending');
        return;
      }

      // Only proceed with assessment check if user is APPROVED
      if (session.user.status !== RegistrationStatus.APPROVED) {
        return;
      }

      const allowedRoles: UserRole[] = [
        UserRole.STUDENT,
        UserRole.LECTURER,
        UserRole.TECHNICIAN,
        UserRole.OTHER,
        UserRole.FACULTY,
      ];

      if (allowedRoles.includes(session.user.role)) {
        try {
          setIsChecking(true);
          const hasTakenAssessment = await hasUserTakenAnyAssessment();
          if (!hasTakenAssessment) {
            console.log("Redirecting to SOP page - no assessment taken");
            router.push('/sop/sop-1756819829791/view');
          }
        } catch (error) {
          console.error("Failed to check assessment status:", error);
        } finally {
          setIsChecking(false);
        }
      }
    }

    handleSession();
  }, [status, session, router, isChecking]);

  return null;
}