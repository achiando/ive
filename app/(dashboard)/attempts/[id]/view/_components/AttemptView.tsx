"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SafetyTestAttemptWithRelations } from "@/types/safety-test";
import { ArrowLeft, Calendar, Clock, User, Wrench, BookOpen, FileText, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface AttemptViewProps {
  attempt: SafetyTestAttemptWithRelations;
  userAttempts: SafetyTestAttemptWithRelations[];
}

export function AttemptView({ attempt, userAttempts }: AttemptViewProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'ONE_TIME':
        return 'bg-green-100 text-green-800';
      case 'DAILY':
        return 'bg-blue-100 text-blue-800';
      case 'WEEKLY':
        return 'bg-purple-100 text-purple-800';
      case 'MONTHLY':
        return 'bg-orange-100 text-orange-800';
      case 'QUARTERLY':
        return 'bg-red-100 text-red-800';
      case 'BI_ANNUAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'ANNUAL':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getManualTypeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-100 text-red-800';
      case 'VIDEO':
        return 'bg-blue-100 text-blue-800';
      case 'LINK':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (percentage: number | null) => {
    if (percentage === null) return 'bg-gray-100 text-gray-800';
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreIcon = (percentage: number | null) => {
    if (percentage === null) return null;
    if (percentage >= 70) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/attempts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Attempts
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attempt Details</h1>
            <p className="text-gray-500">Review safety test attempt information</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold">
                {attempt.user.firstName} {attempt.user.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm">{attempt.user.email}</p>
            </div>
            {attempt.user.role && (
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="text-sm capitalize">{attempt.user.role.toLowerCase().replace('_', ' ')}</p>
              </div>
            )}
            {attempt.user.department && (
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-sm">{attempt.user.department}</p>
              </div>
            )}
            {attempt.user.position && (
              <div>
                <label className="text-sm font-medium text-gray-500">Position</label>
                <p className="text-sm">{attempt.user.position}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score Information */}
      {(attempt.score !== null || attempt.totalQuestions !== null || attempt.percentage !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getScoreIcon(attempt.percentage)}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {attempt.score !== null && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Score</label>
                  <p className="text-2xl font-bold">
                    {attempt.score} {attempt.totalQuestions ? `/ ${attempt.totalQuestions}` : ''}
                  </p>
                </div>
              )}
              {attempt.percentage !== null && attempt.percentage !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Percentage</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getScoreColor(attempt.percentage)}>
                      {attempt.percentage !== null && attempt.percentage !== undefined ? `${attempt.percentage.toFixed(1)}%` : 'N/A'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {attempt.percentage >= 70 ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              )}
              {attempt.totalQuestions !== null && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Questions</label>
                  <p className="text-lg font-semibold">{attempt.totalQuestions}</p>
                </div>
              )}
            </div>
            {attempt.percentage !== null && attempt.percentage !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">Progress</label>
                <div className="mt-2">
                  <Progress value={attempt.percentage} className="h-2" />
                </div>
              </div>
            )}
            <div className="pt-2">
              <div className="text-sm text-gray-600">
                {attempt.percentage !== null && attempt.percentage !== undefined && attempt.percentage >= 70 && (
                  <p className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Congratulations! You passed the safety test with a score of {attempt.percentage.toFixed(1)}%.
                  </p>
                )}
                {attempt.percentage !== null && attempt.percentage !== undefined && attempt.percentage < 70 && (
                  <p className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    You did not pass the safety test. A score of 70% or higher is required. Your score: {attempt.percentage.toFixed(1)}%.
                  </p>
                )}
                {(attempt.percentage === null || attempt.percentage === undefined) && (
                  <p className="text-gray-500">
                    Score information is not available for this attempt.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Test Information */}
      {attempt.safetyTest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Safety Test Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Test Name</label>
                <p className="text-lg font-semibold">{attempt.safetyTest.name}</p>
              </div>
              {attempt.safetyTest.frequency && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Frequency</label>
                  <div className="mt-1">
                    <Badge className={getFrequencyColor(attempt.safetyTest.frequency)}>
                      {attempt.safetyTest.frequency.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            {attempt.safetyTest.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm mt-1">{attempt.safetyTest.description}</p>
              </div>
            )}
            {attempt.safetyTest.manualUrl && (
              <div>
                <label className="text-sm font-medium text-gray-500">Manual/Resource</label>
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={attempt.safetyTest.manualUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Manual
                      {attempt.safetyTest.manualType && (
                        <Badge className={`ml-2 ${getManualTypeColor(attempt.safetyTest.manualType)}`}>
                          {attempt.safetyTest.manualType}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equipment Information */}
      {attempt.equipment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Equipment Name</label>
                <p className="text-lg font-semibold">{attempt.equipment.name}</p>
              </div>
              {attempt.equipment.serialNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="text-sm">{attempt.equipment.serialNumber}</p>
                </div>
              )}
            </div>
            {attempt.equipment.category && (
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-sm">{attempt.equipment.category}</p>
              </div>
            )}
            {attempt.equipment.location && (
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm">{attempt.equipment.location}</p>
              </div>
            )}
            {attempt.equipment.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm mt-1">{attempt.equipment.description}</p>
              </div>
            )}
            <div className="pt-4">
              <Button variant="outline" asChild>
                <Link href={`/equipments/${attempt.equipment.id}/view`}>
                  <Wrench className="mr-2 h-4 w-4" />
                  View Equipment Details
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/users/${attempt.userId}/view`}>
                <User className="mr-2 h-4 w-4" />
                View User Profile
              </Link>
            </Button>
            {attempt.safetyTestId && (
              <Button variant="outline" asChild>
                <Link href={`/sop/${attempt.safetyTestId}/view`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Safety Test
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(attempt.id)}
            >
              Copy Attempt ID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User's Other Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Other Test Attempts by {attempt.user.firstName} {attempt.user.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userAttempts
              .filter(userAttempt => userAttempt.id !== attempt.id)
              .slice(0, 10)
              .map((userAttempt) => (
                <div
                  key={userAttempt.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-semibold">
                          {userAttempt.safetyTest?.name || 'General Test'}
                        </h4>
                        {userAttempt.equipment && (
                          <p className="text-sm text-gray-600">
                            Equipment: {userAttempt.equipment.name}
                            {userAttempt.equipment.serialNumber && ` (${userAttempt.equipment.serialNumber})`}
                          </p>
                        )}
                      </div>
                      {userAttempt.percentage !== null && userAttempt.percentage !== undefined && (
                        <div className="flex items-center gap-2">
                          <Badge className={getScoreColor(userAttempt.percentage)}>
                            {userAttempt.percentage.toFixed(1)}%
                          </Badge>
                          {userAttempt.percentage >= 70 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Completed: {formatDate(userAttempt.completedAt)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/attempts/${userAttempt.id}/view`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              ))}
            
            {userAttempts.filter(userAttempt => userAttempt.id !== attempt.id).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No other test attempts found for this user.</p>
              </div>
            )}
            
            {userAttempts.filter(userAttempt => userAttempt.id !== attempt.id).length > 10 && (
              <div className="text-center pt-4">
                <Button variant="outline" asChild>
                  <Link href={`/attempts?user=${attempt.userId}`}>
                    View All Attempts ({userAttempts.filter(userAttempt => userAttempt.id !== attempt.id).length} more)
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
