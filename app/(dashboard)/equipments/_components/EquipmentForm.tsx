"use client";
 
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EquipmentStatus } from '@/types/equipment'; // Import EquipmentStatus enum
import { ImageIcon, Loader2, X } from 'lucide-react';

const equipmentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus),
  dailyCapacity: z.number().int().positive({
    message: 'Daily Capacity must be a positive number',
  }),
  imageFile: z.any().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  manualFile: z.any().optional(),
  manualUrl: z.string().url('Invalid manual URL').optional().or(z.literal('')),
});
export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

interface EquipmentFormProps {
  initialData?: EquipmentFormValues;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function EquipmentForm({ initialData, onSubmit, onCancel }: EquipmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  // Define available categories
  const categories = [
    'Electronics',
    'Mechanical',
    'Furniture',
    'Tools',
    'IT Equipment',
    'Lab Equipment',
    'Other'
  ];

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      category: '',
      model: '',
      serialNumber: '',
      location: '',
      status: EquipmentStatus.AVAILABLE, // Use enum value
      dailyCapacity: 1,
      imageFile: undefined,
      imageUrl: '',
      manualFile: undefined,
      manualUrl: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    form.setValue('imageFile', file);
  };

  const removeImage = () => {
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
    form.setValue('imageFile' as any, undefined);
    form.setValue('imageUrl' as any, '');
    setImagePreview(null);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('manualFile', file);
    }
  };

  const removeManual = () => {
    if (manualFileInputRef.current) {
      manualFileInputRef.current.value = '';
    }
    form.setValue('manualFile' as any, undefined);
    form.setValue('manualUrl' as any, '');
  };

  async function handleFormSubmit(data: EquipmentFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter equipment name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Enter model number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter serial number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(EquipmentStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')} {/* Format for display */}
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
            name="dailyCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Capacity *</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter equipment description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Equipment Image</FormLabel>
          <div className="mt-2 flex items-center gap-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Equipment preview"
                  className="h-32 w-32 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-md border-2 border-dashed">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <input
                type="file"
                ref={imageFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={imagePreview ? removeImage : () => imageFileInputRef.current?.click()}
              >
                {imagePreview ? 'Change image' : 'Upload image'}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Recommended size: 800x400px
              </p>
            </div>
          </div>
        </div>

        <div>
          <FormLabel>Equipment Manual</FormLabel>
          <div className="mt-2 flex items-center gap-4">
            {form.watch('manualUrl') ? (
              <div className="relative">
                <a href={form.watch('manualUrl')} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  View Current Manual
                </a>
                <button
                  type="button"
                  onClick={removeManual}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-md border-2 border-dashed">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <input
                type="file"
                ref={manualFileInputRef}
                accept="application/pdf"
                className="hidden"
                onChange={handleManualChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => manualFileInputRef.current?.click()}
              >
                Upload Manual
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Accepts PDF files.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Save Changes' : 'Create Equipment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}