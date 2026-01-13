"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentPreview } from '@/components/ui/DocumentPreview';
import { getSafetyTestById } from '@/lib/actions/safety-test';
import { SafetyTestWithRelations } from '@/types/safety-test';
import { UserRole } from '@prisma/client';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, CalendarDays, ExternalLink, FileText, Shield, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';


export default function SopViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const safetyTestId = params.id as string;
  const [safetyTest, setSafetyTest] = useState<SafetyTestWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManualInteracted, setIsManualInteracted] = useState(false); // New state for user interaction
  const [isTimerExpired, setIsTimerExpired] = useState(false); // New state for timer
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes in seconds

  const isFirstLogin = searchParams.get('firstLogin') === 'true';
  const isStudent = session?.user?.role === UserRole.STUDENT;
  const isFirstLoginSafetyFlow = isFirstLogin && isStudent;

  useEffect(() => {
    const fetchSafetyTest = async () => {
      try {
        const test = await getSafetyTestById(safetyTestId);
        if (!test) {
          setError("SOP Manual not found.");
        } else {
          setSafetyTest(test);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load SOP Manual.");
        toast.error(err.message || "Failed to load SOP Manual.");
      } finally {
        setLoading(false);
      }
    };
    fetchSafetyTest();
  }, [safetyTestId]);

  // Timer effect
  useEffect(() => {
    console.log("[Timer Effect] useEffect is running."); // New log
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsTimerExpired(true);
          console.log("[Timer Effect] Timer expired, setIsTimerExpired(true)");
          return 0;
        }
        console.log(`[Timer Effect] Remaining time: ${prevTime - 1}`);
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Timer now runs for all users, once on mount 

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading SOP Manual...</h1>
      </div>
    );
  }

  if (error || !safetyTest) {
    return (
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SOP Manual Not Found</h1>
          <p className="text-gray-600 mb-6">
            The SOP manual you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/sop">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SOP Manuals
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleTakeAssessment = () => {
    const queryParams = new URLSearchParams();
    queryParams.set('safetyTestId', safetyTest.id);
    const equipmentIdFromQuery = searchParams.get('equipmentId');
    if (equipmentIdFromQuery) {
      queryParams.set('equipmentId', equipmentIdFromQuery);
    }
    if (isFirstLogin) {
      queryParams.set('firstLogin', 'true');
    }
    router.push(`/assessment?${queryParams.toString()}`);
  };

  const isButtonDisabled = !isTimerExpired || !isManualInteracted;
  const timerMessage = !isTimerExpired
    ? `Please read the manual. You can take the test in ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')} minutes.`
    : '';

  return (
    <div className="container mx-auto px-4">
      {isFirstLoginSafetyFlow && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Welcome to the Lab!</h3>
              <p className="text-sm text-blue-700">
                Before accessing the lab facilities, please review this safety manual and complete the assessment.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        {!isFirstLoginSafetyFlow && (
          <Button variant="ghost" onClick={() => router.push("/sop")} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to SOP Manuals
          </Button>
        )}
        <div className="flex items-center space-x-2">
          {safetyTest.manualUrl && (
            <Button variant="outline" asChild>
              <a
                href={safetyTest.manualUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Manual in New Tab
              </a>
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <Badge variant="secondary">SOP Manual</Badge>
            {safetyTest.manualType && (
              <Badge variant="outline">{safetyTest.manualType}</Badge>
            )}
            <Badge variant="outline">Frequency: {safetyTest.frequency.replace(/_/g, ' ')}</Badge>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {safetyTest.name}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            {safetyTest.description}
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Required for: {safetyTest.requiredForRoles.length > 0 ? safetyTest.requiredForRoles.map(role => role.replace(/_/g, ' ')).join(', ') : 'All Users'}
            </div>
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-1" />
              Created: {format(new Date(safetyTest.createdAt), "PPP")}
            </div>
          </div>
          {safetyTest.associatedEquipmentTypes && safetyTest.associatedEquipmentTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm font-medium text-gray-700">Associated Equipment Types:</span>
              {safetyTest.associatedEquipmentTypes.map((type, index) => (
                <Badge key={index} variant="secondary">{type}</Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      <DocumentPreview url={safetyTest.manualUrl || ''} onUserInteraction={() => setIsManualInteracted(true)} />

      <div className="mt-10 flex flex-col items-center">
        <Button
          onClick={handleTakeAssessment}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          // disabled={isButtonDisabled}
        >
          Take Safety Assessment
        </Button>
        {timerMessage && (
          <p className="mt-2 text-sm text-gray-600">{timerMessage}</p>
        )}
      </div>
    </div>
  );
}