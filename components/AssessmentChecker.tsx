"use client";

import { hasUserTakenAnyAssessment } from "@/lib/actions/user-assessment";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AssessmentChecker() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
        try {
          const hasTakenAssessment = await hasUserTakenAnyAssessment();
          if (!hasTakenAssessment) {
            // If no assessment has been taken, redirect to the specific SOP page.
            router.push('/sop/sop-1756819829791/view');
          }
        } catch (error) {
          console.error(
            "Failed to check assessment status:",
            error
          );
        }
      }
    }

    // Only run the check if the session is authenticated.
    if (status === "authenticated") {
      checkAssessmentStatus();
    }
  }, [status, session?.user?.id, session?.user?.role, router]);

  // This component does not render anything itself. It only handles the redirect logic.
  return null;
}

