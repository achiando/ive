'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EquipmentStatus, EquipmentWithRelations, Project } from '@/types/equipment'; // Corrected imports
import { EquipmentBooking } from '@prisma/client'; // Keep only necessary Prisma types
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EquipmentViewProps {
  equipment: EquipmentWithRelations;
  userRole: string; // UserRole from Prisma is an enum, but here it's used as a string
  onUpdateStatus: (id: string, status: EquipmentStatus) => Promise<any>; // Prop for status update
  fetchUserProjects: () => Promise<any>; // Added fetchUserProjects
}

export function EquipmentView({ equipment, userRole, onUpdateStatus }: EquipmentViewProps) {
  const router = useRouter();



  // New state to store fetched projects
  const [projects, setProjects] = useState<Project[]>([]);


  const getStatusBadge = (status?: EquipmentStatus) => { // Changed type to EquipmentStatus
    // Default to outline variant if status is not provided
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>;
    }

    // Define status map for string statuses
    const statusMap: Record<EquipmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      [EquipmentStatus.AVAILABLE]: { 
        label: 'Available', 
        variant: 'default',
        className: 'bg-green-500 hover:bg-green-600 text-white'
      },
      [EquipmentStatus.IN_USE]: { 
        label: 'In Use', 
        variant: 'secondary',
        className: ''
      },
      [EquipmentStatus.MAINTENANCE]: { 
        label: 'Maintenance', 
        variant: 'destructive',
        className: ''
      },
      [EquipmentStatus.OUT_OF_SERVICE]: { 
        label: 'Out of Service', 
        variant: 'outline',
        className: ''
      },
    };

    const { label, variant, className } = statusMap[status] || { 
      label: status, 
      variant: 'outline' as const,
      className: ''
    };
    
    return (
      <Badge variant={variant} className={className}>
        {label}
      </Badge>
    );
  };

  // Removed loading and error states, as equipment is passed as a prop
  // The parent page.tsx will handle initial loading and error states

  const { 
    name, 
    model, 
    serialNumber, 
    status, 
    location, 
    maintenances = [],
    notes,
    bookings = [],
    image,
    category,
    description,
    manufacturer,
    manualUrl,
    purchaseDate,
    warrantyExpiry,
    dailyCapacity
  } = equipment;
  
  // Get the most recent maintenance record
  const lastMaintenance = maintenances.length > 0 
    ? maintenances[0] 
    : null;
  const nextMaintenance = null; // You'll need to implement logic to determine next scheduled maintenance

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <div className="ml-auto">
          {getStatusBadge(status as EquipmentStatus)}
        </div>
      </div>
      {/* Equipment details including image,description,specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Overview</CardTitle>
          <CardDescription>Detailed information and specifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Equipment Image */}
            {image ? (
              <div className="md:col-span-1">
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50 md:col-span-1">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
            
            {/* Equipment Details */}
            <div className="space-y-4 md:col-span-2">
              <div>
                <h3 className="text-lg font-semibold">{name}</h3>
                {category && (
                  <p className="text-sm text-muted-foreground">{category}</p>
                )}
              </div>
              
              {description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{manufacturer || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="font-medium">{serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="font-medium">{getStatusBadge(status as EquipmentStatus)}</div>
                </div>
                {dailyCapacity !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Capacity</p>
                    <p className="font-medium">{dailyCapacity}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 pt-2">
                {manualUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={manualUrl} target="_blank" rel="noopener noreferrer">
                      View Manual
                    </a>
                  </Button>
                )}
                {purchaseDate && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Purchased</p>
                    <p>{new Date(purchaseDate).toLocaleDateString()}</p>
                  </div>
                )}
                {warrantyExpiry && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Warranty</p>
                    <p>{new Date(warrantyExpiry).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {notes && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Additional Notes</p>
              <p className="mt-1 text-sm">{notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>Maintenance history and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Maintenance</p>
                    <p className="font-medium">
                      {lastMaintenance ? format(new Date(lastMaintenance.endDate || lastMaintenance.startDate), 'PPp') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-yellow-100 p-2">
                    <Wrench className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Maintenance</p>
                    <p className="font-medium">
                      {nextMaintenance ? format(new Date(nextMaintenance), 'PPp') : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Wrench className="mr-2 h-4 w-4" />
                  Log Maintenance
                </Button>
                <Button size="sm" onClick={() => console.log('Mark for Maintenance')}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Mark for Maintenance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>Current and upcoming bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings && bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking: EquipmentBooking) => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {booking.userId || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.startDate), 'PP')} - {format(new Date(booking.endDate), 'PP')}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {new Date(booking.endDate) < new Date() ? 'Completed' : 'Upcoming'}
                        </Badge>
                      </div>
                      {booking.purpose && (
                        <p className="mt-2 text-sm">
                          {booking.purpose}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming bookings</p>
                </div>
              )}
              
              <Button className="w-full mt-4" >
                <Calendar className="mr-2 h-4 w-4" />
                Book Equipment
              </Button>
              {/* Project Selection Dialog */}
              {/* Booking Dialog */}
              {/* No Approved Projects Dialog */}

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {equipment.status === EquipmentStatus.AVAILABLE && (
                <Button variant="outline" className="w-full justify-start" onClick={() => onUpdateStatus(equipment.id, EquipmentStatus.IN_USE)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as In Use
                </Button>
              )}
              {equipment.status === EquipmentStatus.IN_USE && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onUpdateStatus(equipment.id, EquipmentStatus.AVAILABLE)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Available
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* MaintenanceDialog */}
    </div>
  );
}
