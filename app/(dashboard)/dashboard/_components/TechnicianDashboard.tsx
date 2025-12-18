import { DashboardStats } from './DashboardStats';
import { MaintenanceAlerts } from './MaintenanceAlerts';
import { UpcomingEvents } from './UpcomingEvents';
import { Wrench, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TechnicianDashboardProps {
  dashboardData?: {
    stats?: {
      assignedMaintenance?: number;
      completedMaintenance?: number;
      pendingMaintenance?: number;
      inProgressMaintenance?: number;
    };
    recentMaintenance?: any[];
    upcomingMaintenance?: any[];
  };
  isLoading: boolean;
  currentUserId: string;
}

export function TechnicianDashboard({ dashboardData, isLoading, currentUserId }: TechnicianDashboardProps) {
  // Safely get values with defaults
  const stats = dashboardData?.stats || {};
  const recentMaintenance = dashboardData?.recentMaintenance || [];
  const upcomingMaintenance = dashboardData?.upcomingMaintenance || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats 
          title="Assigned Maintenance" 
          value={stats?.assignedMaintenance?.toString() || '0'} 
          description="Tasks assigned to you" 
          icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Pending Tasks" 
          value={stats?.pendingMaintenance?.toString() || '0'} 
          description="Require attention" 
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="In Progress" 
          value={stats?.inProgressMaintenance?.toString() || '0'} 
          description="Currently working on" 
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Completed This Month" 
          value={stats?.completedMaintenance?.toString() || '0'} 
          description="Tasks completed" 
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Maintenance */}
        <MaintenanceAlerts 
            maintenanceItems={recentMaintenance} 
            isLoading={isLoading}
            showAssignedOnly={true}
          />
          <UpcomingEvents 
            events={upcomingMaintenance.map(maintenance => ({
              id: maintenance.id,
              name: maintenance.equipment?.name || 'Maintenance',
              startDate: maintenance.scheduledDate,
              endDate: maintenance.dueDate || new Date(new Date(maintenance.scheduledDate).getTime() + 60 * 60 * 1000), // Default 1 hour duration
              venue: maintenance.location || 'Lab',
              description: maintenance.notes || 'Scheduled maintenance',
              createdById: maintenance.assignedToId || '',
              status: maintenance.status
            }))} 
            isLoading={isLoading}
          />
      </div>
    </div>
  );
}
