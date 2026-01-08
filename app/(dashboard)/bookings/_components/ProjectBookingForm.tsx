"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BookingDetails } from "@/types/booking";
import { toast } from "sonner";

interface ProjectBookingFormProps {
  projectId?: string; // Passed from parent, if booking is project-specific
  equipmentIds?: string[]; // Passed from parent, if booking is equipment-specific
  bookingId?: string; // For editing existing booking
  initialData?: BookingDetails; // For pre-filling form in edit mode
  onSuccess?: () => Promise<{ navigateBack?: boolean }>;
  className?: string;
  equipmentList: Equipment[]; // Equipment list passed as prop
  userId: string; // userId passed as prop
  onSubmit: (data: BookingFormData) => Promise<any>; // New onSubmit prop
}

interface Equipment {
  id: string;
  name: string;
  model?: string | null;
  serialNumber?: string | null;
  status: string;
}

export interface BookingFormData { // Exported for use in page.tsx
  equipmentId: string;
  startDate: Date;
  endDate: Date;
  bookingHours: number;
  bookingTime: string;
  purpose: string;
  notes?: string;
  projectId?: string; // Added projectId to BookingFormData
}

export default function ProjectBookingForm({
  projectId,
  bookingId,
  initialData,
  onSuccess,
  className,
  equipmentList,
  userId,
  onSubmit, // Destructure onSubmit
}: ProjectBookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed to isSubmitting
  const [error, setError] = useState<string | null>(null);
  
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);

  // Filter available equipment (not in maintenance or out of service)
  useEffect(() => {
    if (equipmentList) {
      const available = equipmentList.filter(
        (item: Equipment) => 
          item.status !== 'MAINTENANCE' && 
          item.status !== 'OUT_OF_SERVICE' &&
          item.status !== 'DECOMMISSIONED'
      );
      setAvailableEquipment(available);
    }
  }, [equipmentList]);

  const [formData, setFormData] = useState<BookingFormData>({
    equipmentId: initialData?.equipment.id || '',
    startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
    endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to next day
    bookingHours: initialData?.bookingHours || 1,
    bookingTime: initialData?.bookingTime || '09:00',
    purpose: initialData?.purpose || '',
    notes: initialData?.notes || '',
    projectId: initialData?.projectId || projectId, // Initialize projectId from initialData or prop
  });
  
  // Generate time slots from 9:00 AM to 5:30 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 17) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    slots.push('17:00');
    return slots;
  };
  
  const handleChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => { // Renamed to handleFormSubmit
    e.preventDefault();
    
    // Basic validation
    if (!formData.equipmentId) {
      setError('Please select equipment');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    // Validate booking hours (max 2 hours)
    if (formData.bookingHours < 1 || formData.bookingHours > 2) {
      setError('Booking duration must be between 1 and 2 hours');
      return;
    }
    
    const now = new Date();
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    // Reset seconds and milliseconds for accurate comparison
    now.setSeconds(0, 0);
    startDate.setSeconds(0, 0);
    endDate.setSeconds(0, 0);
    
    if (startDate < now && !bookingId) { // Only check for past dates if creating a new booking
      setError('Start date cannot be in the past');
      return;
    }
    
    if (startDate >= endDate) {
      setError('End date must be after start date');
      return;
    }
    
    if (!formData.purpose) {
      setError('Please enter a purpose for the booking');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(formData); // Call the onSubmit prop
      
      toast("Success!", {
        description: `Booking ${bookingId ? 'updated' : 'created'} successfully.`,
      });
      
      if (onSuccess) {
        const response = await onSuccess();
        if (response?.navigateBack) {
          router.back(); // Navigate back for updates
          return;
        }
      } else {
        // Default redirection if no onSuccess is provided
        router.push(`/dashboard/bookings`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process booking');
      console.error('Error processing booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formTitle = bookingId ? "Edit Equipment Booking" : "New Equipment Booking";
  const formDescription = bookingId ? "Modify details of this booking." : "Book equipment for your project.";
  const submitButtonText = bookingId ? (isSubmitting ? 'Updating...' : 'Update Booking') : (isSubmitting ? 'Creating...' : 'Create Booking');

  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div>
        <h2 className="text-2xl font-bold">{formTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {formDescription}
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="equipmentId">Select Equipment</Label>
            <Select
              value={formData.equipmentId}
              onValueChange={(value) => handleChange('equipmentId', value)}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {availableEquipment.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No equipment available for booking
                  </div>
                ) : (
                  availableEquipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center">
                        <span className="font-medium">{item.name}</span>
                        {item.model && (
                          <span className="text-muted-foreground ml-2 text-sm">
                            {item.model}
                          </span>
                        )}
                        {item.serialNumber && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            (S/N: {item.serialNumber})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <input
                id="start-date"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  if (date) handleChange('startDate', date);
                }}
                disabled={isSubmitting}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <input
                id="end-date"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  if (date) handleChange('endDate', date);
                }}
                disabled={isSubmitting || !formData.startDate}
                min={formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bookingHours">Duration (hours)</Label>
              <select
                id="bookingHours"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.bookingHours}
                onChange={(e) => handleChange('bookingHours', parseInt(e.target.value))}
                disabled={isSubmitting}
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="bookingTime">Start Time</Label>
              <select
                id="bookingTime"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.bookingTime}
                onChange={(e) => handleChange('bookingTime', e.target.value)}
                disabled={isSubmitting}
              >
                {generateTimeSlots().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="What will this equipment be used for?"
              required
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information or special requests..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
}
