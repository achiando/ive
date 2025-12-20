"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { removeProjectMember, updateProjectMemberStatus } from '@/lib/actions/project';
import { ProjectWithDetails } from '@/types/project';
import { ProjectMember } from '@prisma/client';
import { CheckCircle, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MemberCardProps {
  member: ProjectMember & { user: ProjectWithDetails['members'][0]['user'] };
  canManageMembers: boolean;
  onUpdateSuccess: (memberId: string, status: ProjectMember['status']) => void;
  onRemoveSuccess: (memberId: string) => void;
}

export function MemberCard({ member, canManageMembers, onUpdateSuccess, onRemoveSuccess }: MemberCardProps) {
  const handleUpdateStatus = async (status: ProjectMember['status']) => {
    try {
      await updateProjectMemberStatus(member.id, status as any); // Cast to any as ProjectMember['status'] is broader than 'ACCEPTED' | 'REJECTED' | 'REVOKED'
      toast.success(`Member status updated to ${status}.`);
      onUpdateSuccess(member.id, status);
    } catch (error: any) {
      toast.error('Failed to update member status.', {
        description: error.message,
      });
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeProjectMember(member.id);
      toast.success('Member removed successfully.');
      onRemoveSuccess(member.id);
    } catch (error: any) {
      toast.error('Failed to remove member.', {
        description: error.message,
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-white">
      <div className="flex items-center space-x-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={member.user?.profileImage || undefined} />
          <AvatarFallback>
            {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Invited User'}</p>
          <p className="text-sm text-muted-foreground">
            {member.user?.email || 'No email'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={member.status === 'ACCEPTED' ? 'default' : member.status === 'PENDING_APPROVAL' ? 'secondary' : 'outline'}>
          {member.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
        </Badge>
        {canManageMembers && member.status === 'PENDING_APPROVAL' && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleUpdateStatus('ACCEPTED')}
              title="Approve Member"
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleUpdateStatus('REJECTED')}
              title="Reject Member"
            >
              <XCircle className="h-5 w-5 text-red-500" />
            </Button>
          </>
        )}
        {canManageMembers && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRemove}
            title="Remove Member"
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
