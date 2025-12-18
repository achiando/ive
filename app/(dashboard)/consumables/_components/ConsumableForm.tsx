"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getEquipmentList } from '@/lib/actions/consumable';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConsumableCategory } from '@prisma/client';
import { ChevronDown, Loader2, PackagePlus, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Zod schema for consumable form validation
const consumableFormSchema = z.object({
  name: z.string().min(1, "Consumable name is required."),
  description: z.string().optional(),
  category: z.nativeEnum(ConsumableCategory),
  unit: z.string().min(1, "Unit of measurement is required."),
  currentStock: z.number().min(0, "Current stock cannot be negative."),
  minimumStock: z.number().min(0, "Minimum stock cannot be negative."),
  unitCost: z.number().int().positive({
    message: 'Unit cost must be a positive number',
  }),
  location: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
  equipmentIds: z.array(z.string()).optional(),
});

export type ConsumableFormValues = z.infer<typeof consumableFormSchema>;

interface ConsumableFormProps {
  initialData?: ConsumableFormValues & { id?: string };
  onSubmit: (values: ConsumableFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function ConsumableForm({ initialData, onSubmit, onCancel }: ConsumableFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.image || null);
  const [equipmentList, setEquipmentList] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);

  const form = useForm<ConsumableFormValues>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || ConsumableCategory.CONSUMABLE,
      unit: initialData?.unit || '',
      currentStock: initialData?.currentStock || 0,
      minimumStock: initialData?.minimumStock || 0,
      unitCost: initialData?.unitCost || 0,
      location: initialData?.location || '',
      supplier: initialData?.supplier || '',
      notes: initialData?.notes || '',
      image: initialData?.image || '',
      equipmentIds: initialData?.equipmentIds || [],
    },
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      setIsLoadingEquipment(true);
      try {
        const data = await getEquipmentList();
        setEquipmentList(data);
      } catch (error) {
        console.error('Error fetching equipment:', error);
        toast.error('Failed to load equipment list');
      } finally {
        setIsLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewImage(null);
    form.setValue('image', '');
  };

  const handleEquipmentChange = (equipmentId: string, checked: boolean) => {
    const currentEquipmentIds = form.getValues('equipmentIds') || [];
    const newEquipmentIds = checked
      ? [...currentEquipmentIds, equipmentId]
      : currentEquipmentIds.filter(id => id !== equipmentId);
    form.setValue('equipmentIds', newEquipmentIds);
  };

  const handleFormSubmit = async (values: ConsumableFormValues) => {
    await onSubmit(values);
  };

  return (
    <div>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of the consumable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 9V Battery"
                  {...form.register('name')}
                />
                <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value) => form.setValue('category', value as ConsumableCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ConsumableCategory.CONSUMABLE}>Consumable</SelectItem>
                    <SelectItem value={ConsumableCategory.SPARE}>Spare</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-red-500">{form.formState.errors.category?.message}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a brief description of the consumable"
                rows={3}
                {...form.register('description')}
              />
              <p className="text-sm text-red-500">{form.formState.errors.description?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                name="imageFile"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewImage && (
                <div className="relative w-32 h-32 mt-2 group">
                  <img src={previewImage} alt="Consumable Preview" className="w-full h-full object-cover rounded-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-0 right-0 rounded-full h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveImage}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Details</CardTitle>
            <CardDescription>Configure the stock settings for this consumable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measurement *</Label>
                <Input
                  id="unit"
                  placeholder="e.g., pcs, kg, L"
                  {...form.register('unit')}
                />
                <p className="text-sm text-red-500">{form.formState.errors.unit?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStock">Initial Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.watch('currentStock') ?? 0}
                  onChange={(e) => form.setValue('currentStock', e.target.value === "" ? 0 : Number(e.target.value))}
                />
                <p className="text-sm text-red-500">{form.formState.errors.currentStock?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Minimum Stock Level</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.watch('minimumStock') ?? 0}
                  onChange={(e) => form.setValue('minimumStock', e.target.value === "" ? 0 : Number(e.target.value))}
                />
                <p className="text-sm text-red-500">{form.formState.errors.minimumStock?.message}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.watch('unitCost') ?? 0}
                    onChange={(e) => form.setValue('unitCost', e.target.value === "" ? 0 : Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
                <p className="text-sm text-red-500">{form.formState.errors.unitCost?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Associated Equipment</CardTitle>
            <CardDescription>Select equipment this consumable is associated with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Equipment</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={isLoadingEquipment}
                    type="button"
                  >
                    {form.watch('equipmentIds') && form.watch('equipmentIds')!.length > 0
                      ? `${form.watch('equipmentIds')!.length} equipment selected`
                      : 'Select equipment...'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {isLoadingEquipment ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading equipment...
                      </div>
                    ) : equipmentList.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No equipment found
                      </div>
                    ) : (
                      <div className="space-y-2 p-1">
                        {equipmentList.map((item) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`equipment-${item.id}`}
                                checked={form.watch('equipmentIds')?.includes(item.id)}
                                onChange={(e) =>
                                  handleEquipmentChange(item.id, e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <label
                              htmlFor={`equipment-${item.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {item.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {form.watch('equipmentIds') && form.watch('equipmentIds')!.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.watch('equipmentIds')!.map(id => {
                    const eq = equipmentList.find(e => e.id === id);
                    return eq ? (
                      <Badge key={id} variant="secondary" className="text-sm">
                        {eq.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Add any additional details about this consumable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Shelf A1, Storage Room"
                  {...form.register('location')}
                />
                <p className="text-sm text-red-500">{form.formState.errors.location?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="e.g., Amazon, Local Store"
                  {...form.register('supplier')}
                />
                <p className="text-sm text-red-500">{form.formState.errors.supplier?.message}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or instructions"
                rows={3}
                {...form.register('notes')}
              />
              <p className="text-sm text-red-500">{form.formState.errors.notes?.message}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <PackagePlus className="mr-2 h-4 w-4" />
                {initialData ? 'Save Changes' : 'Create Consumable'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}