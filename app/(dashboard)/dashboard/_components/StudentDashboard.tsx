import { AlertCircle, Calendar, CheckCircle, Clock } from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { RecentBookings } from './RecentBookings';

interface StudentDashboardProps {
  dashboardData: {
    stats: {
      activeBookings: number;
      upcomingBookings: number;
      availableEquipment: number;
      pendingRequests: number;
    };
    activeBookings: any[];
    upcomingBookings: any[];
    bookingHistory: any[];
  } | null;
  isLoading: boolean;
}

export function StudentDashboard({ dashboardData, isLoading }: StudentDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="rounded-lg bg-primary/10 p-6">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your equipment bookings and lab access.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats 
          title="Active Bookings" 
          value={dashboardData?.stats?.activeBookings?.toString() || '0'} 
          description="Currently active equipment" 
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Past Bookings" 
          value={dashboardData?.bookingHistory?.length.toString() || '0'} 
          description="Completed sessions" 
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Equipment Access" 
          value={dashboardData?.stats?.availableEquipment?.toString() || '0'} 
          description="Available equipment" 
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <DashboardStats 
          title="Upcoming Bookings" 
          value={dashboardData?.stats?.upcomingBookings?.toString() || '0'} 
          description="Future bookings" 
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-4">
          <RecentBookings 
            bookings={dashboardData?.activeBookings || []} 
            isLoading={isLoading}
            title="Your Active Bookings"
            emptyMessage="No active bookings. Book equipment to get started!"
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:col-span-3">
          <RecentBookings 
            bookings={dashboardData?.bookingHistory || []} 
            isLoading={isLoading}
            title="Recent Booking History"
            emptyMessage="No booking history yet. Start booking equipment!"
          />
        </div>
      </div>
    </div>
  );
}
