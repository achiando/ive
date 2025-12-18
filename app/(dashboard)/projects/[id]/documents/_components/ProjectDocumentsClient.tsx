"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { addProjectDocument } from '@/lib/actions/project';
import { ProjectWithDetails } from '@/types/project';
import { ProjectDocument, UserRole } from '@prisma/client';
import { File as FileIcon, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { DocumentCard } from './DocumentCard';

interface ProjectDocumentsClientProps {
  project: ProjectWithDetails;
  initialDocuments: ProjectDocument[];
  userRole: UserRole;
}

export function ProjectDocumentsClient({ project, initialDocuments, userRole }: ProjectDocumentsClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments);
  const [newDocumentUrl, setNewDocumentUrl] = useState('');
  const [isAddingDocument, setIsAddingDocument] = useState(false);

  const isCreator = project.creator.id === project.creatorId; // Assuming project.creator.id is the actual creator's ID
  const isAdminOrManager = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;
  const canManageDocuments = isCreator || isAdminOrManager;

  const handleAddDocument = async () => {
    if (!newDocumentUrl.trim()) {
      toast.error('Document URL cannot be empty.');
      return;
    }

    setIsAddingDocument(true);
    try {
      const fileType = newDocumentUrl.split('.').pop()?.toLowerCase();
      const addedDocument = await addProjectDocument(project.id, newDocumentUrl, fileType ? `application/${fileType}` : undefined);
      setDocuments((prevDocs) => [...prevDocs, addedDocument]);
      setNewDocumentUrl('');
      toast.success('Document added successfully.');
      router.refresh();
    } catch (error: any) {
      toast.error('Failed to add document.', {
        description: error.message,
      });
    } finally {
      setIsAddingDocument(false);
    }
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
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <CardDescription>Enter the URL of the document you want to add to this project.</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Document URL (e.g., https://example.com/document.pdf)"
                  value={newDocumentUrl}
                  onChange={(e) => setNewDocumentUrl(e.target.value)}
                  disabled={isAddingDocument}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="w-full flex flex-col gap-2">
                <div className="flex justify-between">
                <Button 
                  onClick={handleAddDocument} 
                  disabled={isAddingDocument || !newDocumentUrl.trim()}
                  className="w-full"
                >
                  {isAddingDocument ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : 'Upload Document'}
                </Button>
                <Button variant="outline" onClick={() => router.push(`/projects/${project.id}/members`)}>
                  Add Team Members
                </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Supported formats: PDF, DOCX, XLSX, PPTX, JPG, PNG, etc.
                </p>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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