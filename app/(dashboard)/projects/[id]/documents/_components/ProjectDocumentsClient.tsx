"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { addProjectDocument } from '@/lib/actions/project';
import { ProjectWithDetails } from '@/types/project';
import { ProjectDocument, UserRole } from '@prisma/client';
import { File as FileIcon, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AddDocumentDialog } from './AddDocumentDialog';
import { DocumentCard } from './DocumentCard';

interface ProjectDocumentsClientProps {
  project: ProjectWithDetails;
  initialDocuments: ProjectDocument[];
  userRole: UserRole;
}

export function ProjectDocumentsClient({ project, initialDocuments, userRole }: ProjectDocumentsClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments);

  const isCreator = project.creator.id === project.creatorId;
  const isAdminOrManager = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;
  const canManageDocuments = isCreator || isAdminOrManager;

  const handleDocumentAdded = (newDocument: ProjectDocument) => {
    setDocuments((prevDocs) => [...prevDocs, newDocument]);
    router.refresh();
  };

  const handleDeleteSuccess = (documentId: string) => {
    setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Project Documents for "{project.title}"</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/projects/${project.id}/members`)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Manage Members
          </Button>
          <Button onClick={() => router.push(`/projects/${project.id}/view`)} variant="outline">
            Back to Project
          </Button>
        </div>
      </div>

      {canManageDocuments && (
        <AddDocumentDialog
          projectId={project.id}
          onDocumentAdded={handleDocumentAdded}
          addProjectDocumentAction={addProjectDocument}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc} 
                  canManageDocuments={canManageDocuments} 
                  onDeleteSuccess={handleDeleteSuccess} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
