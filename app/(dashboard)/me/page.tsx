import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/actions/user';
import { BookingStatus, ProjectStatus, RegistrationStatus, UserRole } from '@prisma/client';
import { format } from 'date-fns';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// Format role for display
const formatRole = (role: UserRole) => {
  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.ADMIN_TECHNICIAN]: 'Admin Technician',
    [UserRole.LAB_MANAGER]: 'Lab Manager',
    [UserRole.LECTURER]: 'Lecturer',
    [UserRole.STUDENT]: 'Student',
    [UserRole.TECHNICIAN]: 'Technician',
    [UserRole.OTHER]: 'Other',
    // Add FACULTY if it exists in your UserRole enum
    // [UserRole.FACULTY]: 'Faculty', 
  };
  return roleLabels[role] || role;
};

// Format status for display
const formatStatus = (status: RegistrationStatus) => {
  return status.toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login'); // Redirect to login if no user session
  }

  // Type definitions for user data, matching the structure returned by getCurrentUser
  type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: Date | null;
    image?: string | null;
    role: UserRole;
    status: RegistrationStatus;
    registrationComplete?: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Optional fields that might be present
    phoneNumber?: string;
    department?: string | null;
    position?: string | null;
    employeeId?: string | null;
    studentId?: string | null;
    yearOfStudy?: number | null;
    program?: string | null;
    lastLogin?: Date | null;
    // Relations
    equipmentBookings?: Array<{
      id: string;
      equipment: {
        name: string;
      };
      startDate: Date;
      endDate: Date;
      status: BookingStatus;
    }>;
    projects?: Array<{
      id: string;
      title: string;
      status: ProjectStatus;
      startDate: Date | null;
      endDate: Date | null;
    }>;
    // Count relations
    _count?: {
      createdProjects?: number;
      equipmentBookings?: number;
      projectMemberships?: number;
      eventParticipations?: number;
    };
  };

  const typedUser = user as UserProfile;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button asChild>
          <Link href="/me/edit">
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{`${typedUser.firstName} ${typedUser.lastName}`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{typedUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{typedUser.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profile Status</p>
              <Badge variant={typedUser.status === 'APPROVED' ? 'default' : 'outline'}>
                {formatStatus(typedUser.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Role & Access */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Access</CardTitle>
            <CardDescription>Your system access level and permissions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{formatRole(typedUser.role)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{typedUser.department || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Position</p>
              <p className="font-medium">{typedUser.position || 'Not specified'}</p>
            </div>
            {typedUser.employeeId && (
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{typedUser.employeeId}</p>
              </div>
            )}
            {typedUser.studentId && (
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium">{typedUser.studentId}</p>
              </div>
            )}
            {typedUser.yearOfStudy && (
              <div>
                <p className="text-sm text-muted-foreground">Year of Study</p>
                <p className="font-medium">Year {typedUser.yearOfStudy}</p>
              </div>
            )}
            {typedUser.program && (
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="font-medium">{typedUser.program}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and activity</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Account Created</p>
              <p className="font-medium">{typedUser.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{typedUser.updatedAt.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="font-medium">
                {typedUser.lastLogin ? typedUser.lastLogin.toLocaleString() : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        {typedUser._count && (
          <Card>
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
              <CardDescription>Summary of your activities in the system</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold">{typedUser._count.createdProjects || 0}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold">{typedUser._count.equipmentBookings || 0}</p>
                <p className="text-sm text-muted-foreground">Bookings</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold">{typedUser._count.projectMemberships || 0}</p>
                <p className="text-sm text-muted-foreground">Project Memberships</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold">{typedUser._count.eventParticipations || 0}</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Bookings */}
        {typedUser.equipmentBookings && typedUser.equipmentBookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your upcoming equipment bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typedUser.equipmentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.equipment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(booking.startDate, 'MMM d, yyyy h:mm a')} - {format(booking.endDate, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant={booking.status === 'APPROVED' ? 'default' : 'outline'}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Projects */}
        {/* Recent Projects */}
        {typedUser.projects && typedUser.projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Projects you're involved in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typedUser.projects
                  .sort((a, b) =>
                    (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0)
                  )
                  .slice(0, 3) // Show only the 3 most recent projects
                  .map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.startDate ? format(project.startDate, 'MMM d, yyyy') : 'No start date'}
                            {project.endDate && ` - ${format(project.endDate, 'MMM d, yyyy')}`}
                          </p>
                        </div>
                        <Badge variant="secondary">{project.status}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
