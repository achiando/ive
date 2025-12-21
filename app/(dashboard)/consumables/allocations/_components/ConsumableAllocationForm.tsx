"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BookingDetails } from "@/types/booking"; // Assuming BookingDetails is available
import { ConsumableAllocationFormData, ConsumableWithRelations } from "@/types/consumable";
import { MaintenanceWithRelations } from "@/types/maintenance"; // Assuming MaintenanceDetails is available
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ConsumableAllocationFormProps {
  initialData?: ConsumableAllocationFormData; // For editing existing allocation
  consumables: ConsumableWithRelations[]; // List of available consumables
  bookings: BookingDetails[]; // List of available bookings
  maintenanceRecords: MaintenanceWithRelations[]; // List of available maintenance records
  onSubmit: (data: ConsumableAllocationFormData) => Promise<any>;
  onSuccess?: () => void;
  className?: string;
}

export function ConsumableAllocationForm({
  initialData,
  consumables,
  bookings,
  maintenanceRecords,
  onSubmit,
  onSuccess,
  className,
}: ConsumableAllocationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
console.log(consumables)
  const [formData, setFormData] = useState<ConsumableAllocationFormData>({
    consumableId: initialData?.consumableId || '',
    quantity: initialData?.quantity || 1,
    purpose: initialData?.purpose || '',
    allocatedDate: initialData?.allocatedDate ? new Date(initialData.allocatedDate) : new Date(),
    bookingId: initialData?.bookingId || null,
    maintenanceId: initialData?.maintenanceId || null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        consumableId: initialData.consumableId || '',
        quantity: initialData.quantity || 1,
        purpose: initialData.purpose || '',
        allocatedDate: initialData.allocatedDate ? new Date(initialData.allocatedDate) : new Date(),
        bookingId: initialData.bookingId || null,
        maintenanceId: initialData.maintenanceId || null,
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof ConsumableAllocationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.consumableId) {
      setError('Please select a consumable.');
      return;
    }
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (!formData.purpose) {
      setError('Please provide a purpose for the allocation.');
      return;
    }
    if (!formData.allocatedDate) {
      setError('Please select an allocation date.');
      return;
    }

    // Ensure only one of bookingId or maintenanceId is set
    if (formData.bookingId && formData.maintenanceId) {
      setError('An allocation can only be linked to either a booking or a maintenance record, not both.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success(`Consumable allocation ${initialData ? 'updated' : 'created'} successfully.`);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/consumables/allocations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process consumable allocation.');
      console.error('Error processing consumable allocation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formTitle = initialData ? "Edit Consumable Allocation" : "New Consumable Allocation";
  const formDescription = initialData ? "Modify details of this consumable allocation." : "Allocate a consumable to a booking or maintenance record.";
  const submitButtonText = initialData ? (isSubmitting ? 'Updating...' : 'Update Allocation') : (isSubmitting ? 'Creating...' : 'Create Allocation');

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
            <Label htmlFor="consumableId">Consumable</Label>
            <Select
              value={formData.consumableId}
              onValueChange={(value) => handleChange('consumableId', value)}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a consumable" />
              </SelectTrigger>
              <SelectContent>
                {consumables.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No consumables available
                  </div>
                ) : (
                  consumables.map((consumable) => (
                    <SelectItem key={consumable.id} value={consumable.id}>
                      {consumable.name} ({consumable.currentStock} {consumable.unit} available)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
              min={1}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="Why is this consumable being allocated?"
              required
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="allocatedDate">Allocation Date</Label>
            <Input
              id="allocatedDate"
              type="date"
              value={formData.allocatedDate ? format(formData.allocatedDate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                if (date) handleChange('allocatedDate', date);
              }}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="bookingId">Link to Booking (Optional)</Label>
            <Select
              value={formData.bookingId || ''}
              onValueChange={(value) => handleChange('bookingId', value === 'null' ? null : value)}
              disabled={isSubmitting || !!formData.maintenanceId} // Disable if maintenanceId is set
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a booking" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">None</SelectItem>
                {bookings.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No bookings available
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.purpose} (Equipment: {booking.equipment.name}, User: {booking.user?.name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maintenanceId">Link to Maintenance (Optional)</Label>
            <Select
              value={formData.maintenanceId || ''}
              onValueChange={(value) => handleChange('maintenanceId', value === 'null' ? null : value)}
              disabled={isSubmitting || !!formData.bookingId} // Disable if bookingId is set
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a maintenance record" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">None</SelectItem>
                {maintenanceRecords.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No maintenance records available
                  </div>
                ) : (
                  maintenanceRecords.map((maintenance) => (
                    <SelectItem key={maintenance.id} value={maintenance.id}>
                      {maintenance.description} (Equipment: {maintenance.equipment.name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
