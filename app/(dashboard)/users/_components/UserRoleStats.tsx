'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, UserPlus, UserMinus } from 'lucide-react';
import { User, UserRole, RegistrationStatus } from '@prisma/client';
import { useEffect, useState } from 'react';

interface UserRoleStatsProps {
  users: User[];
  isLoading: boolean;
  className?: string;
  currentMonthUsers?: number; // Add current month users prop
}

const statusLabels: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'Pending',
  [RegistrationStatus.APPROVED]: 'Approved',
  [RegistrationStatus.REJECTED]: 'Rejected',
  [RegistrationStatus.INVITED]: 'Invited',
  [RegistrationStatus.EXPIRED]: 'Expired',
  [RegistrationStatus.SUSPENDED]: 'Suspended',
};

const statusIcons = {
  [RegistrationStatus.APPROVED]: <UserCheck className="h-4 w-4 text-green-500" />,
  [RegistrationStatus.PENDING]: <UserPlus className="h-4 w-4 text-yellow-500" />,
  [RegistrationStatus.REJECTED]: <UserX className="h-4 w-4 text-red-500" />,
  [RegistrationStatus.INVITED]: <UserPlus className="h-4 w-4 text-blue-500" />,
  [RegistrationStatus.EXPIRED]: <UserX className="h-4 w-4 text-orange-500" />,
  [RegistrationStatus.SUSPENDED]: <UserX className="h-4 w-4 text-red-500" />,
};

const roleIcons = {
  [UserRole.ADMIN]: <Users className="h-4 w-4 text-muted-foreground" />,
  [UserRole.ADMIN_TECHNICIAN]: <Users className="h-4 w-4 text-muted-foreground" />,
  [UserRole.TECHNICIAN]: <Users className="h-4 w-4 text-muted-foreground" />,
  [UserRole.LECTURER]: <Users className="h-4 w-4 text-muted-foreground" />,
  [UserRole.STUDENT]: <Users className="h-4 w-4 text-muted-foreground" />,
  [UserRole.LAB_MANAGER]: <Users className="h-4 w-4 text-muted-foreground" />,
  [UserRole.OTHER]: <Users className="h-4 w-4 text-muted-foreground" />,
};

// Helper function to format role names for display
const formatRoleName = (role: string) => {
  return role
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function UserRoleStats({ users = [], isLoading, className, currentMonthUsers: propCurrentMonthUsers = 0 }: UserRoleStatsProps) {
  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];
  const totalUsers = safeUsers.length;
  
  // Calculate current month's new users
  const currentMonthUsers = safeUsers.filter(user => {
    const userDate = new Date(user.createdAt);
    const now = new Date();
    return userDate.getMonth() === now.getMonth() && 
           userDate.getFullYear() === now.getFullYear();
  }).length;
  
  // Calculate active users from the past week
  const activeThisWeek = safeUsers.filter(user => {
    if (user.status !== RegistrationStatus.APPROVED || !user.lastLogin) return false;
    const lastLogin = new Date(user.lastLogin);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return lastLogin >= oneWeekAgo;
  }).length;
  
  // Calculate active and inactive users
  const activeUsers = safeUsers.filter(user => user.status === RegistrationStatus.APPROVED);
  const activeCount = activeUsers.length;
  const inactiveCount = totalUsers - activeCount;
  
  // Initialize all roles with 0 count
  const allRoles = Object.values(UserRole);
  const roleCounts = allRoles.reduce((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {} as Record<UserRole, number>);

  // Count users by role
  safeUsers.forEach(user => {
    if (user.role) {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    }
  });

  // Count users by status
  const statusCounts = safeUsers.reduce<Record<RegistrationStatus, number>>((acc, user) => {
    if (user.status) {
      acc[user.status] = (acc[user.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<RegistrationStatus, number>);

  // Calculate percentages
  const getPercentage = (count: number) => {
    return totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
  };

  // Get most common role
  const mostCommonRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0];
  const mostCommonStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0];
  
  // Calculate users active in the last 30 minutes
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const activeNow = safeUsers.filter(user => {
    if (!user.lastLogin) return false;
    const lastLogin = new Date(user.lastLogin);
    return lastLogin > thirtyMinutesAgo;
  }).length;

  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Role cards data - filter out roles with 0 users for a cleaner display
  const roleCards = allRoles
    .map(role => ({
      role,
      count: roleCounts[role] || 0,
      percentage: getPercentage(roleCounts[role] || 0)
    }))
    .filter(item => item.count > 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount} active • {inactiveCount} inactive
            </p>
          </CardContent>
        </Card>

    

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Online</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeNow}</div>
            <p className="text-xs text-muted-foreground">
              Active in last 30 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Role</CardTitle>
            {mostCommonRole && roleIcons[mostCommonRole[0] as UserRole] || <Users className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostCommonRole ? formatRoleName(mostCommonRole[0]) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {mostCommonRole?.[1] || 0} users • {mostCommonRole ? getPercentage(mostCommonRole[1]) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Status</CardTitle>
            {mostCommonStatus && statusIcons[mostCommonStatus[0] as RegistrationStatus] || <Users className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostCommonStatus?.[0] ? formatRoleName(mostCommonStatus[0]) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {mostCommonStatus?.[1] || 0} users • {mostCommonStatus ? getPercentage(mostCommonStatus[1]) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roleCards.map(({ role, count, percentage }) => (
            <Card key={role}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {formatRoleName(role)}
                  </CardTitle>
                  {roleIcons[role as UserRole] || <Users className="h-4 w-4 text-muted-foreground" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Registration Status Breakdown */}
      {Object.keys(statusCounts).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 mt-8">Registration Status</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {statusLabels[status as RegistrationStatus] || status.toLowerCase()}
                    </CardTitle>
                    {statusIcons[status as RegistrationStatus] || <Users className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{getPercentage(count)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500" 
                        style={{ 
                          width: `${getPercentage(count)}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
