import { AssessmentBot } from "@/components/AssessmentBot";
import { getEquipmentById } from '@/lib/actions/equipment'; // Import getEquipmentById
import { getSafetyTestById, recordSafetyTestAttempt } from '@/lib/actions/safety-test'; // Import getSafetyTestById

interface AssessmentTestPageProps {
  searchParams: {
    safetyTestId?: string;
    equipmentId?: string;
  };
}

export default async function AssessmentTestPage({ searchParams }: AssessmentTestPageProps) {

  const { safetyTestId, equipmentId } = await searchParams;


  let safetyTest;
  let equipment;
  let documentTitle = "Safety Assessment";
  let manualUrl: string | null | undefined = null;

  if (safetyTestId) {
    safetyTest = await getSafetyTestById(safetyTestId);
    if (!safetyTest) {
      console.warn(`Safety Test with ID ${safetyTestId} not found.`);
    } else {
      documentTitle = safetyTest.name;
      manualUrl = safetyTest.manualUrl;
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
    }
  }

  // Fallback for documentTitle if neither safetyTest nor equipment provided a name
  if (!safetyTestId && !equipmentId) {
    documentTitle = "General Safety Assessment";
  }


  // Conditional rendering: AssessmentBot requires a string equipmentId for recording attempts
  if (!equipmentId) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Assessment Bot Test Page</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">Equipment ID is required to start an assessment.</p>
          <p className="text-red-700">Please provide an `equipmentId` in the URL search parameters.</p>
        </div>
      </div>
    );
  }

  if (!equipmentId) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <p>Equipment ID is required to start the assessment.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Assessment Bot Test Page</h1>
      <AssessmentBot
        safetyTestId={safetyTestId}
        equipmentId={equipmentId}
        manualUrl={manualUrl}
        documentTitle={documentTitle}
        onRecordAttempt={recordSafetyTestAttempt}
        open={true}
      />
    </div>
  );
}
