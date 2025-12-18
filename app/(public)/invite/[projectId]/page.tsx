import { getProjectById } from '@/lib/actions/project';
import { notFound } from 'next/navigation';
import { InviteClient } from './_components/InviteClient';

interface InvitePageProps {
  params: {
    projectId: string;
  };
  searchParams: {
    token?: string;
  };
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { projectId } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound(); // Token is required for an invite page
  }

  const project = await getProjectById(projectId, true); // Call with publicView: true

  if (!project) {
    notFound(); // Project not found
  }

  return <InviteClient project={project} token={token} />;
}
