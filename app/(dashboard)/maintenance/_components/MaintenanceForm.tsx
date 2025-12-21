"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, PlusCircle, X } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { MaintenanceWithRelations } from '@/types/maintenance';
import { Consumable, ConsumableCategory, MaintenanceOrderState, MaintenanceStatus, MaintenanceType } from '@prisma/client';


import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { createMaintenance, updateMaintenance } from '@/lib/actions/maintenance';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Define types for maintenance form
const maintenanceOrderStates = [
  'NONE',
  'PENDING_ORDER',
  'ORDERED',
  'RECEIVED',
] as const;

const maintenanceFormSchema = z.object({
  equipmentId: z.string().min(1, "Equipment is required."),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.nativeEnum(MaintenanceStatus),
  type: z.nativeEnum(MaintenanceType), // Added MaintenanceType
  orderStatus: z.nativeEnum(MaintenanceOrderState),
  consumableAllocations: z.array(
    z.object({
      consumableId: z.string(),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
    })
  ).optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceFormProps {
  initialData?: MaintenanceWithRelations;
  onSubmitSuccess: () => void;
  equipmentIdFromParams?: string; // Optional equipment ID from URL params
  equipmentList: Array<{ id: string; name: string }>; // New prop
  consumableList: Consumable[]; // New prop
  technicianList: Array<{ id: string; firstName: string; lastName: string; email: string }>; // New prop
  session: Session | null;
}

export function MaintenanceForm({
  initialData,
  onSubmitSuccess,
  equipmentIdFromParams,
  equipmentList, // Destructure new prop
  consumableList, // Destructure new prop
  technicianList, // Destructure new prop
  session
}: MaintenanceFormProps) {
  const router = useRouter();
console.log(consumableList)
  const createdById = session?.user?.id;

  const [selectedConsumableId, setSelectedConsumableId] = React.useState('');
  const [selectedConsumableQuantity, setSelectedConsumableQuantity] = React.useState(1);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    mode: 'onChange',
    defaultValues: {
      equipmentId: initialData?.equipmentId || equipmentIdFromParams || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      notes: initialData?.notes || '',
      priority: (initialData?.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(initialData.priority)
        ? initialData.priority
        : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      status: initialData?.status || MaintenanceStatus.SCHEDULED,
      type: initialData?.type || MaintenanceType.CORRECTIVE, // Default type
      orderStatus: initialData?.orderStatus || MaintenanceOrderState.NONE,
      consumableAllocations: initialData?.consumableAllocations?.map(alloc => ({
        consumableId: alloc.consumableId,
        quantity: alloc.quantity,
      })) || [],
      assignedToId: initialData?.assignedToId || undefined,
    },
  });

  const handleCancel = React.useCallback(() => {
    router.push("/maintenance");
  }, [router]);

  // Set default equipment if equipmentIdFromParams is provided and form is new
  React.useEffect(() => {
    if (equipmentIdFromParams && !initialData) {
      form.setValue('equipmentId', equipmentIdFromParams);
      const selectedEquipment = equipmentList.find(eq => eq.id === equipmentIdFromParams);
      if (selectedEquipment) {
        form.setValue('title', `Maintenance for ${selectedEquipment.name}`);
      }
    }
  }, [equipmentIdFromParams, initialData, equipmentList, form]);

  const spareParts = React.useMemo(() =>
    consumableList.filter((consumable) => consumable.category === ConsumableCategory.SPARE),
    [consumableList]
  );

  const handleAddConsumable = () => {
    if (!selectedConsumableId || selectedConsumableQuantity < 1) {
      toast.error("Please select a consumable and enter a valid quantity.");
      return;
    }

    const currentAllocations = form.getValues('consumableAllocations') || [];
    const existingAllocationIndex = currentAllocations.findIndex(
      (alloc) => alloc.consumableId === selectedConsumableId
    );

    if (existingAllocationIndex > -1) {
      // Update existing allocation
      const updatedAllocations = [...currentAllocations];
      updatedAllocations[existingAllocationIndex].quantity += selectedConsumableQuantity;
      form.setValue('consumableAllocations', updatedAllocations);
    } else {
      // Add new allocation
      form.setValue('consumableAllocations', [
        ...currentAllocations,
        { consumableId: selectedConsumableId, quantity: selectedConsumableQuantity },
      ]);
    }

    setSelectedConsumableId('');
    setSelectedConsumableQuantity(1);
  };

  const handleRemoveConsumable = (consumableId: string) => {
    const currentAllocations = form.getValues('consumableAllocations') || [];
    form.setValue(
      'consumableAllocations',
      currentAllocations.filter((item) => item.consumableId !== consumableId)
    );
  };

  const onSubmit = async (data: MaintenanceFormValues) => {
    if (!createdById) {
      toast.error("User not authenticated. Please log in.");
      router.push('/api/auth/signin');
      return;
    }

    const submissionData = {
      ...data,
      assignedToId: data.assignedToId === 'unassigned' ? undefined : data.assignedToId,
    };

    try {
      let result;
      if (initialData) {
        result = await updateMaintenance(initialData.id, { ...submissionData, createdById });
      } else {
        result = await createMaintenance({ ...submissionData, createdById });
      }

      if (result.success) {
        toast.success(`Maintenance ${initialData ? 'updated' : 'scheduled'} successfully!`);
        onSubmitSuccess();
      } else {
        toast.error(result.message || `Failed to ${initialData ? 'update' : 'schedule'} maintenance.`);
      }
    } catch (error: any) {
      console.error('Error saving maintenance:', error);
      toast.error(error?.message || 'An unexpected error occurred');
    }
  };

  const allocatedConsumables = form.watch('consumableAllocations') || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <>
          <FormField
            control={form.control}
            name="equipmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!equipmentIdFromParams}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {equipmentList.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter maintenance title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the maintenance required..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => {
                const value = field.value ? new Date(field.value) : undefined;
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(value as Date, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={value}
                          onSelect={(date) => field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => {
                const value = field.value ? new Date(field.value) : undefined;
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(value as Date, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={value}
                          onSelect={(date) => field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MaintenanceStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MaintenanceType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {maintenanceOrderStates.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedToId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To (Technician)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {technicianList.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName} ({tech.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Consumable Allocation Section */}
          <div className="space-y-2">
            <FormLabel>Spare Parts Allocation</FormLabel>
            <div className="flex space-x-2">
              <Select
                value={selectedConsumableId}
                onValueChange={setSelectedConsumableId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a spare part" />
                </SelectTrigger>
                <SelectContent>
                  {spareParts.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No spare parts available</div>
                  ) : (
                    spareParts.map((consumable: any) => (
                      <SelectItem
                        key={consumable.id}
                        value={consumable.id}
                        disabled={consumable.currentStock <= 0}
                      >
                        {consumable.name} (Stock: {consumable.currentStock})
                        {consumable.currentStock <= 0 && ' - Out of stock'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Quantity"
                value={selectedConsumableQuantity}
                onChange={(e) => setSelectedConsumableQuantity(Number(e.target.value))}
                min={1}
                className="w-[100px]"
              />
              <Button type="button" onClick={handleAddConsumable}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>

            {allocatedConsumables.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Spare Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocatedConsumables.map((alloc) => {
                    const consumable = consumableList.find(c => c.id === alloc.consumableId);
                    return (
                      <TableRow key={alloc.consumableId}>
                        <TableCell>{consumable?.name}</TableCell>
                        <TableCell>{alloc.quantity}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveConsumable(alloc.consumableId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional information..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                initialData ? 'Update Maintenance' : 'Schedule Maintenance'
              )}
            </Button>
          </div>
        </>
        
      </form>
    </Form>
  );
}
