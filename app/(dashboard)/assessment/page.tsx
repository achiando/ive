import { AssessmentBot } from "@/components/AssessmentBot";
import { getEquipmentById } from '@/lib/actions/equipment'; // Import getEquipmentById
import { getSafetyTestById, recordSafetyTestAttempt } from '@/lib/actions/safety-test'; // Import getSafetyTestById
import { ManualType } from '@prisma/client'; // Import ManualType

interface AssessmentTestPageProps {
  searchParams: {
    safetyTestId?: string;
    equipmentId?: string;
    manualType?: ManualType; // New: manualType from query params
  };
}

export default async function AssessmentTestPage({ searchParams }: AssessmentTestPageProps) {

  const { safetyTestId, equipmentId } = await searchParams;


  let safetyTest;
  let equipment;
  let documentTitle = "Safety Assessment";
  let manualUrl: string | null | undefined = null;
  let manualType: ManualType | null = null;

  if (safetyTestId) {
    safetyTest = await getSafetyTestById(safetyTestId);
    if (!safetyTest) {
      console.warn(`Safety Test with ID ${safetyTestId} not found.`);
    } else {
      documentTitle = safetyTest.name;
      manualUrl = safetyTest.manualUrl;
      manualType = safetyTest.manualType || null;
    }
  }

  if (equipmentId) {
    equipment = await getEquipmentById(equipmentId);
    if (!equipment) {
      console.warn(`Equipment with ID ${equipmentId} not found.`);
    } else {
      // If equipment is found, prioritize its name for documentTitle
      documentTitle = equipment.name;
      // Prioritize equipment's manualUrl if safetyTest didn't have one
      if (!manualUrl) {
        manualUrl = equipment.manualUrl;
      }
      // Set manualType from equipment if not already set
      if (!manualType) {
        manualType = equipment.manualType || null;
      }
    }
  }
  // Fallback for documentTitle if neither safetyTest nor equipment provided a name
  if (!safetyTestId && !equipmentId) {
    documentTitle = "General Safety Assessment";
  }


  return (
    <div className="container mx-auto p-8">
      <AssessmentBot
        safetyTestId={safetyTestId}
        equipmentId={equipmentId}
        manualUrl={manualUrl}
        manualType={manualType || undefined} 
        documentTitle={documentTitle}
        onRecordAttempt={recordSafetyTestAttempt}
        open={true}
      />
    </div>
  );
}
