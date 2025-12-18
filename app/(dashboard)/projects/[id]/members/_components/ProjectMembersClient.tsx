"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { generateProjectInviteToken } from '@/lib/actions/project';
import { generateQRCodeDataURL } from '@/lib/qr-code';
import { ProjectWithDetails } from '@/types/project';
import { ProjectMember, UserRole } from '@prisma/client';
import { Copy, Loader2, Mail, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { sendProjectInvites } from '../../../_actions';
import { MemberCard } from './MemberCard'; // Import MemberCard

interface ProjectMembersClientProps {
  project: ProjectWithDetails;
  initialMembers: ProjectMember[];
  userRole: UserRole;
}

export function ProjectMembersClient({ project, initialMembers, userRole }: ProjectMembersClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<ProjectMember[]>(initialMembers);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const isCreator = project.creatorId === project.creator.id;
  const isAdminOrManager = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;
  const canManageMembers = isCreator || isAdminOrManager;

  const handleAddMemberByEmail = async () => {
    if (!newMemberEmail.trim()) {
      toast.error('Email cannot be empty.');
      return;
    }

    setIsAddingMember(true);
    try {
      const emails = newMemberEmail.split(',').map(email => email.trim()).filter(email => email);
      if (emails.length === 0) {
        toast.error('Please enter valid email addresses.');
        setIsAddingMember(false);
        return;
      }

      const creatorName = `${project.creator.firstName} ${project.creator.lastName}`;
      const result = await sendProjectInvites(project.id, emails, project.title, creatorName);

      if (result.success) {
        toast.success(result.message || 'Invites sent successfully!');
        setNewMemberEmail('');
        router.refresh(); // Refresh to show the new INVITED members
      } else {
        toast.error(result.message || 'Failed to send some invites.');
      }
    } catch (error: any) {
      toast.error('Failed to send invites.', {
        description: error.message,
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    setIsGeneratingInvite(true);
    try {
      const token = await generateProjectInviteToken(project.id);
      const generatedInviteLink = `${window.location.origin}/invite/${project.id}?token=${token}`;
      setInviteLink(generatedInviteLink);

      const qrCode = await generateQRCodeDataURL(generatedInviteLink, {
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataURL(qrCode);
      setIsInviteDialogOpen(true); // Open the dialog

      toast.success('Invite link generated!', {
        description: 'The link and QR code are ready to be shared.',
        duration: 5000,
      });
      router.refresh(); // Refresh to show the new INVITED member
    } catch (error: any) {
      toast.error('Failed to generate invite link.', {
        description: error.message,
      });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      toast.info('Invite link copied to clipboard!');
    }
  };

  const handleUpdateMemberStatusSuccess = (memberId: string, status: ProjectMember['status']) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, status } : m));
    router.refresh();
  };

  const handleRemoveMemberSuccess = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Project Members for "{project.title}"</h1>
        <Button onClick={() => router.push(`/projects/${project.id}/view`)} variant="outline">
          Back to Project
        </Button>
      </div>

      {canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>Generate an invite link or add members by email (comma-separated).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Member Email(s) (e.g., user1@example.com, user2@example.com)"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={isAddingMember}
              />
              <Button onClick={handleAddMemberByEmail} disabled={isAddingMember} className="min-w-[150px]">
                {isAddingMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send Invites
              </Button>
            </div>
            <div className="flex justify-center items-center text-sm text-muted-foreground">
              <span>OR</span>
            </div>
            <Button onClick={handleGenerateInviteLink} disabled={isGeneratingInvite} className="w-full">
              {isGeneratingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Generate Invite Link
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members in this project yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member as any} // Cast to any due to nested user type in ProjectWithDetails
                  canManageMembers={canManageMembers} 
                  onUpdateSuccess={handleUpdateMemberStatusSuccess} 
                  onRemoveSuccess={handleRemoveMemberSuccess} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Link Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Project Invite Link</DialogTitle>
            <DialogDescription>
              Share this link or QR code to invite new members to "{project.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            {qrCodeDataURL && (
              <div className="p-4 border rounded-lg bg-white">
                <img src={qrCodeDataURL} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            {inviteLink && (
              <div className="w-full flex flex-col items-center space-y-2">
                <p className="text-sm text-muted-foreground break-all text-center">{inviteLink}</p>
                <Button onClick={handleCopyLink} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" /> Copy Link
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}