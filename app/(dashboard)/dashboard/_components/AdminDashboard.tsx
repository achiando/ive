import { HardDrive as Tool, Users, Briefcase, Calendar } from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { FullyBookedEquipment } from './FullyBookedEquipment'; // New import
import { LowStockAlerts } from './LowStockAlerts';
import { MaintenanceAlerts } from './MaintenanceAlerts';
import { RecentBookings } from './RecentBookings';
import { UpcomingEvents } from './UpcomingEvents';

interface AdminDashboardProps {
  dashboardData: {
    totalEquipment: number;
    totalProjects: number;
    totalUsers: number;
    totalEvents: number;
    recentBookings: any[];
    upcomingEvents: any[];
    pendingMaintenance: any[];
    lowStockItems: any[];
    fullyBookedEquipment: any[];
  };
  isLoading: boolean;
}

export function AdminDashboard({ dashboardData, isLoading }: AdminDashboardProps) {
  return (
    <div className="space-y-6 ">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats 
          title="Total Equipment" 
          value={dashboardData?.totalEquipment?.toString() || '0'} 
          description="Total equipment in inventory" 
          icon={<Tool className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Total Projects" 
          value={dashboardData?.totalProjects?.toString() || '0'} 
          description="Active projects" 
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Total Users" 
          value={dashboardData?.totalUsers?.toString() || '0'} 
          description="Registered users" 
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Total Events" 
          value={dashboardData?.totalEvents?.toString() || '0'} 
          description="Scheduled events" 
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-4">
          <RecentBookings 
            bookings={dashboardData?.recentBookings || []} 
            isLoading={isLoading} 
          />
          <MaintenanceAlerts 
            maintenanceItems={dashboardData?.pendingMaintenance || []} 
            isLoading={isLoading} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:col-span-3">
          {/* <FullyBookedEquipment
            equipment={dashboardData?.fullyBookedEquipment || []}
            isLoading={isLoading}
          /> */}
          <UpcomingEvents 
            events={dashboardData?.upcomingEvents || []} 
            isLoading={isLoading} 
          />
          <LowStockAlerts 
            consumables={dashboardData?.lowStockItems || []} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
}
