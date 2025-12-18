"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithDetails } from '@/types/project';
import { ProjectMember, UserRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserPlus, Loader2, Mail } from 'lucide-react';
import { generateProjectInviteToken } from '@/lib/actions/project';
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

  const isCreator = project.creatorId === project.creator.id;
  const isAdminOrManager = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;
  const canManageMembers = isCreator || isAdminOrManager;

  const handleAddMemberByEmail = async () => {
    if (!newMemberEmail.trim()) {
      toast.error('Email cannot be empty.');
      return;
    }
    // This functionality is not directly supported by the current `generateProjectInviteToken`
    // as it creates an invite token, not directly adds a user by email.
    // For direct add by email, a new action would be needed that finds the user and adds them.
    // For now, we'll simulate an invite.
    toast.info("Directly adding members by email is not yet implemented. An invite link will be generated instead.");
    setNewMemberEmail('');
  };

  const handleGenerateInviteLink = async () => {
    setIsGeneratingInvite(true);
    try {
      const token = await generateProjectInviteToken(project.id);
      const inviteLink = `${window.location.origin}/invite/${project.id}?token=${token}`;
      
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link generated and copied to clipboard!', {
        description: inviteLink,
        duration: 10000,
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
            <CardDescription>Generate an invite link or add a member by email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Member Email (e.g., user@example.com)"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={isAddingMember}
              />
              <Button onClick={handleAddMemberByEmail} disabled={isAddingMember} className="min-w-[150px]">
                {isAddingMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Add by Email
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
    </div>
  );
}