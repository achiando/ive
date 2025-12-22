"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectWithDetails } from '@/types/project';
import { Project as BaseProject, ProjectDocument, ProjectMember, UserRole } from '@prisma/client';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { generateQRCodeDataURL } from '@/lib/qr-code';
import { File as FileIcon, Users } from 'lucide-react';
import { toast } from 'sonner';
import { CellAction } from '../../../_components/cell-action';
import { DocumentCard } from '../../documents/_components/DocumentCard';
import { MemberCard } from '../../members/_components/MemberCard';

type Project = BaseProject & {
  createdAt: string | Date;
  updatedAt: string | Date;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

interface ProjectDetailsProps {
  project: ProjectWithDetails & Project;
  userRole: UserRole;
  onAction: (action: string, data?: any) => void; // onAction from parent page.tsx
  backPath?: string;
}




export function ProjectView({ project, userRole, backPath = '/projects' }: ProjectDetailsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [documents, setDocuments] = useState<ProjectDocument[]>(project.documents); // Initialize with project.documents
  const [members, setMembers] = useState<ProjectMember[]>(project.members); // Initialize with project.members
  const isAdminOrManager = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;
  const membersCount = project.members?.length || 0;
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; regNumber: string }>>([]);



  // Generate QR code when dialog opens
  const generateQrCode = async () => {
    // Use the invite link for the QR code
    const url = `${window.location.origin}/invite/${project.id}`;
    console.log("Generating QR for URL:", url);
    try {
      const qrCode = await generateQRCodeDataURL(url, {
        width: 200,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrCode);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code.");
    }
  };

  const handleDeleteDocumentSuccess = (documentId: string) => {
    setDocuments(documents.filter(doc => doc.id !== documentId)); // Optimistic update
  };

  const handleUpdateMemberStatusSuccess = (memberId: string, status: ProjectMember['status']) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, status } : m));
  };

  const handleRemoveMemberSuccess = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId));
  };

  const renderOverviewContent = () => (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
          <h3 className="font-medium mb-1">Description</h3>
          <p className="text-muted-foreground">
            {project.description || 'No description provided.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium mb-1">Timeline</h3>
            <p className="text-muted-foreground">
              {project.startDate 
                ? `${format(project.startDate instanceof Date ? project.startDate : parseISO(project.startDate), 'MMM d, yyyy')} - ${project.endDate 
                  ? format(project.endDate instanceof Date ? project.endDate : parseISO(project.endDate), 'MMM d, yyyy')
                  : 'Ongoing'}`
                : 'Not specified'}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Status</h3>
            <Badge variant={project.status === 'APPROVED' ? 'default' : 'outline'}>
              {project.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
            </Badge>
          </div>
          <div>
            <h3 className="font-medium mb-1">Members</h3>
            <p className="text-muted-foreground">{membersCount}</p>
          </div>
          <Dialog onOpenChange={(open) => open && generateQrCode()}>
            <DialogTrigger asChild>
              <Button variant="outline">Project QR Code</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Project QR Code</DialogTitle>
                <DialogDescription>
                  Scan this QR code to invite members to this project.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="mb-4 p-4 bg-white rounded-lg">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="Project QR Code" 
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <p>Loading QR Code...</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Share this QR code for others to join the project.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expected Team Members Section (from localStorage) */}
        {teamMembers.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Expected Team Members (from creation)</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-3">
                Team members specified during project creation:
              </p>
              <div className="space-y-2">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      {member.regNumber && (
                        <span className="ml-2 text-sm text-gray-500">({member.regNumber})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Note: This information is for reference only and does not reflect actual project membership.
              </p>
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  );

  const renderDocumentsContent = () => (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Project Documents</h1>
        <Button
          onClick={() => router.push(`/projects/${project.id}/documents`)}
          className="ml-2"
        >
          <FileIcon className="mr-2 h-4 w-4 text-white" />
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <DocumentCard 
              key={doc.id} 
              document={doc} 
              canManageDocuments={isAdminOrManager || project.creatorId === project.creator.id} // Assuming creator can manage docs
              onDeleteSuccess={handleDeleteDocumentSuccess} 
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderMembersContent = () => (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Project Members</h1>
        <Button
          onClick={() => router.push(`/projects/${project.id}/members`)}
          className="ml-2"
        >
          <Users className="mr-2 h-4 w-4 text-white" />
          Manage Members
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No members in this project yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <MemberCard 
              key={member.id} 
              member={member as any} // Cast to any due to nested user type in ProjectWithDetails
              canManageMembers={isAdminOrManager || project.creatorId === project.creator.id} 
              onUpdateSuccess={handleUpdateMemberStatusSuccess} 
              onRemoveSuccess={handleRemoveMemberSuccess} 
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderBookingsContent = () => (
    // Placeholder for ProjectBookingComponent
    <Card>
      <CardHeader>
        <CardTitle>Project Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => router.push(`/bookings/new?projectId=${project.id}`)}>
          Create New Booking
        </Button>
      </CardContent>
    </Card>
  );

  const renderSettingsContent = () => (
    // Placeholder for ProjectSettings component
    <Card>
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Project settings management coming soon.</p>
        {/* <ProjectSettings project={project} onUpdate={(data) => onAction('update', { ...project, ...data })} /> */}
      </CardContent>
    </Card>
  );


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex space-x-2">
          <CellAction 
            data={project} 
            // onAction={onAction} // CellAction handles its own actions
            // variant="outline"
            // size="sm"
          />
          <Button onClick={() => router.push(backPath)} variant="outline">
            Back to Projects
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {renderOverviewContent()}
        {renderBookingsContent()}
        {renderDocumentsContent()}
        {renderMembersContent()}
        {/* {isAdminOrManager && renderSettingsContent()} */}
      </div>
    </div>
  );
}
