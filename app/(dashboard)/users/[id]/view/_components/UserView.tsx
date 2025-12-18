
'use client';

import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Pencil, MessageSquare, CheckCircle, UserX } from 'lucide-react';
import { User, Faculty } from '@prisma/client';

export type UserWithRelations = User & {
    faculty: Faculty | null;
};

interface UserViewProps {
  user: UserWithRelations;
}

export function UserView({ user }: UserViewProps) {
  const router = useRouter();

  // Format role for display
  const formatRole = (role: string) => {
    const roleLabels: Record<string, string> = {
      [UserRole.ADMIN]: 'Admin',
      [UserRole.LAB_MANAGER]: 'Lab Manager',
      [UserRole.LECTURER]: 'Lecturer',
      [UserRole.STUDENT]: 'Student',
      [UserRole.TECHNICIAN]: 'Technician',
      [UserRole.ADMIN_TECHNICIAN]: 'Admin Technician',
      [UserRole.OTHER]: 'External User',
    };
    return roleLabels[role] || role;
  };

  // Format status for display
  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format date for display
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return 'N/A';
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'SUSPENDED':
      case 'REJECTED':
        return 'destructive';
      case 'INVITED':
      case 'EXPIRED':
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="mr-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start space-x-4">
          <Avatar className="h-16 w-16 mt-1">
            <AvatarFallback>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h2>
              <Badge variant={getStatusVariant(user.status)}>
                {formatStatus(user.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              {formatRole(user.role)}
              {user.department && ` • ${user.department}`}
              {user.position && ` • ${user.position}`}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {user.studentId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                <p>{user.studentId}</p>
              </div>
            )}
            {user.employeeId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                <p>{user.employeeId}</p>
              </div>
            )}
            {user.faculty && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faculty</p>
                <p>{user.faculty.name}</p>
              </div>
            )}
            {user.program && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Program</p>
                <p>{user.program}</p>
              </div>
            )}
            {user.yearOfStudy && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Year of Study</p>
                <p>Year {user.yearOfStudy}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>
              <p>{formatDate(user.createdAt)}</p>
            </div>
            {user.phoneNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{user.phoneNumber}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity" disabled>Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Status</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${
                      user.status === 'APPROVED' ? 'bg-green-500' : 
                      user.status === 'PENDING' ? 'bg-yellow-500' : 
                      user.status === 'REJECTED' || user.status === 'SUSPENDED' ? 'bg-red-500' :
                      user.status === 'INVITED' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm">
                      {formatStatus(user.status)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
                  <p className="text-sm">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Type</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {formatRole(user.role)}
                  </Badge>
                  {user.role === UserRole.STUDENT && user.yearOfStudy && (
                    <Badge variant="outline">
                      Year {user.yearOfStudy}
                    </Badge>
                  )}
                </div>
              </div>
              
              {(user.department || user.position) && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {user.role === UserRole.STUDENT ? 'Academic' : 'Professional'} Details
                  </h3>
                  <div className="space-y-2">
                    {user.department && (
                      <p className="text-sm">
                        <span className="font-medium">Department:</span> {user.department}
                      </p>
                    )}
                    {user.position && (
                      <p className="text-sm">
                        <span className="font-medium">Position:</span> {user.position}
                      </p>
                    )}
                    {user.program && (
                      <p className="text-sm">
                        <span className="font-medium">Program:</span> {user.program}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  {user.phoneNumber && (
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {user.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Access</CardTitle>
                <CardDescription>User permissions and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Role</h4>
                    <p className="text-sm">{formatRole(user.role)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Status</h4>
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${
                        user.status === 'APPROVED' ? 'bg-green-500' : 
                        user.status === 'PENDING' ? 'bg-yellow-500' : 
                        user.status === 'REJECTED' || user.status === 'SUSPENDED' ? 'bg-red-500' :
                        user.status === 'INVITED' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm">
                        {formatStatus(user.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Member Since</h4>
                    <p className="text-sm">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Manage user account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/users/${user.id}`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  {user.status === 'PENDING' && (
                    <Button className="w-full justify-start">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve User
                    </Button>
                  )}
                  {user.status === 'APPROVED' && (
                    <Button variant="destructive" className="w-full justify-start">
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate Account
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User's recent actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  Activity tracking coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
