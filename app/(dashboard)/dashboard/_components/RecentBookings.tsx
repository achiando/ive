import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  purpose?: string | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  equipment: {
    name: string;
  };
}

interface RecentBookingsProps {
  bookings: Booking[];
  isLoading?: boolean;
  title?: string;
  emptyMessage?: string;
}

export function RecentBookings({ bookings, isLoading = false, title = 'Recent Bookings', emptyMessage = 'No recent bookings found.' }: RecentBookingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bookings">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-start space-x-4 p-2 hover:bg-muted/50 rounded-md">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {booking.equipment.name}
                    </p>
                    {booking.user && (
                      <p className="text-sm text-muted-foreground">
                        {booking.user.firstName} {booking.user.lastName}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(booking.startDate), 'MMM d, yyyy')} - {format(new Date(booking.endDate), 'MMM d, yyyy')}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      booking.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
