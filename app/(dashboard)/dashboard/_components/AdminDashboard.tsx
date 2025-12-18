import { DashboardStats } from './DashboardStats';
import { RecentBookings } from './RecentBookings';
import { MaintenanceAlerts } from './MaintenanceAlerts';
import { UpcomingEvents } from './UpcomingEvents';
import { LowStockAlerts } from './LowStockAlerts';
import { FullyBookedEquipment } from './FullyBookedEquipment'; // New import
import { Calendar, Clock, Package, HardDrive as Tool, Users, Wrench } from 'lucide-react';

interface AdminDashboardProps {
  dashboardData: {
    totalEquipment: number;
    availableEquipment: number;
    pendingBookings: number;
    activeMaintenance: number;
    recentBookings: any[];
    upcomingEvents: any[];
    pendingMaintenance: any[];
    lowStockItems: any[];
    fullyBookedEquipment: any[]; // New field
  };
  isLoading: boolean;
}

export function AdminDashboard({ dashboardData, isLoading }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats 
          title="Total Equipment" 
          value={dashboardData?.totalEquipment?.toString() || '0'} 
          description="Total equipment in inventory" 
          icon={<Tool className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Available Equipment" 
          value={dashboardData?.availableEquipment?.toString() || '0'} 
          description="Currently available for booking" 
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Pending Bookings" 
          value={dashboardData?.pendingBookings?.toString() || '0'} 
          description="Awaiting approval" 
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Active Maintenance" 
          value={dashboardData?.activeMaintenance?.toString() || '0'} 
          description="In progress or pending" 
          icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
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
          <FullyBookedEquipment
            equipment={dashboardData?.fullyBookedEquipment || []}
            isLoading={isLoading}
          />
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
