"use client";

import { checkUserSafetyTest } from "@/lib/actions/safety-test";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function SafetyTestStatusCell({ 
  equipmentId, 
  requiresTest 
}: { 
  equipmentId: string, 
  requiresTest: boolean 
}) {
  const [hasPassed, setHasPassed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If the test is not required for this equipment, don't fetch anything.
    if (!requiresTest) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    checkUserSafetyTest(equipmentId)
      .then((result) => {
        setHasPassed(result.hasPassed);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [equipmentId, requiresTest]);

  if (!requiresTest) {
    return <Badge variant="secondary">N/A</Badge>;
  }

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Checking...</span>;
  }

  if (hasPassed) {
    return <Badge className="bg-green-500 hover:bg-green-600">Done</Badge>;
  } else {
    return <Badge variant="destructive">Not Done</Badge>;
  }
}
