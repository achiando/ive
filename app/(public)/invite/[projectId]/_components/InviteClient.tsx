"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectWithDetails } from '@/types/project';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { handleJoinProjectInvite } from '../../_actions'; // Import the new server action

interface InviteClientProps {
  project: ProjectWithDetails;
  token: string;
}

export function InviteClient({ project, token }: InviteClientProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinProject = async () => {
    if (!token) {
      setError('No invitation token found.');
      toast.error('No invitation token found.');
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      // Redirect to login page, then back to this invite page
      router.push(`/api/auth/signin?callbackUrl=/invite/${project.id}?token=${token}`);
      return;
    }

    if (!session?.user?.id) {
      setError('User not authenticated after login.');
      toast.error('User not authenticated after login.');
      return;
    }

    setJoining(true);
    try {
      await handleJoinProjectInvite(token, session.user.id, project.id); // Call server action
      toast.success('Successfully requested to join project!', {
        description: 'Your membership is pending approval.',
      });
      // Redirection is handled by the server action
    } catch (err: any) {
      setError(err.message || 'Failed to join project.');
      toast.error('Failed to join project.', { description: err.message });
    } finally {
      setJoining(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <XCircle className="h-6 w-6 mr-2" /> Invitation Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Project: {project.title}</CardTitle>
          <CardDescription>{project.description || 'No description provided.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You have been invited to join the project "{project.title}" by {project.creator.firstName} {project.creator.lastName}.
            </p>
            <p className="mt-2 text-sm font-medium">
              Status: <Badge variant="secondary">{project.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}</Badge>
            </p>
          </div>
          <Button 
            onClick={handleJoinProject} 
            className="w-full" 
            disabled={joining || !token}
          >
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" /> Join Project
              </>
            )}
          </Button>
          {sessionStatus === 'unauthenticated' && (
            <p className="text-center text-sm text-muted-foreground">
              You need to be logged in to join this project.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
