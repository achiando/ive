"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { joinProjectWithToken, getProjectById } from '@/lib/actions/project';
import { ProjectWithDetails } from '@/types/project';

interface InvitePageProps {
  params: {
    projectId: string;
  };
  searchParams: {
    token?: string;
  };
}

export default function InvitePage({ params, searchParams }: InvitePageProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { projectId } = params;
  const { token } = searchParams;

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const fetchedProject = await getProjectById(projectId);
        setProject(fetchedProject);
      } catch (err: any) {
        setError(err.message || 'Failed to load project details.');
        toast.error('Failed to load project details.', { description: err.message });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleJoinProject = async () => {
    if (!token) {
      setError('No invitation token found.');
      toast.error('No invitation token found.');
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      // Redirect to login page, then back to this invite page
      router.push(`/api/auth/signin?callbackUrl=/invite/${projectId}?token=${token}`);
      return;
    }

    if (!session?.user?.id) {
      setError('User not authenticated after login.');
      toast.error('User not authenticated after login.');
      return;
    }

    setJoining(true);
    try {
      await joinProjectWithToken(token, session.user.id);
      toast.success('Successfully requested to join project!', {
        description: 'Your membership is pending approval.',
      });
      router.push(`/projects/${projectId}/view`); // Redirect to project view page
    } catch (err: any) {
      setError(err.message || 'Failed to join project.');
      toast.error('Failed to join project.', { description: err.message });
    } finally {
      setJoining(false);
    }
  };

  if (loading || sessionStatus === 'loading') {
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

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <XCircle className="h-6 w-6 mr-2" /> Project Not Found
            </CardTitle>
            <CardDescription>The project associated with this invitation could not be found.</CardDescription>
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
            disabled={joining || !token || sessionStatus === 'loading'}
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
