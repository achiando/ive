"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiFileUpload } from "@/components/ui/multi-file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SafetyTestFormValues, SafetyTestWithRelations } from "@/types/safety-test";
import { zodResolver } from "@hookform/resolvers/zod";
import { ManualType, SafetyTestFrequency, UserRole } from "@prisma/client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, { message: "SOP Name is required." }),
  description: z.string().optional(),
  manualUrl: z.string().url({ message: "Invalid URL format." }).optional().or(z.literal('')),
  manualType: z.nativeEnum(ManualType).optional(),
  requiredForRoles: z.array(z.nativeEnum(UserRole)).min(1, { message: "At least one role is required." }),
  associatedEquipmentTypes: z.array(z.string()).optional(),
  frequency: z.nativeEnum(SafetyTestFrequency),
});

interface SOPFormProps {
  initialData?: SafetyTestWithRelations | null;
  onSubmitAction: (data: SafetyTestFormValues | ({ id: string } & SafetyTestFormValues)) => Promise<SafetyTestWithRelations>;
  onFormSuccess: (safetyTest: SafetyTestWithRelations) => void;
  onFormCancel: () => void;
}

export function SOPForm({ initialData, onSubmitAction, onFormSuccess, onFormCancel }: SOPFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | undefined>(initialData?.manualUrl || undefined);

const form = useForm<SafetyTestFormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: initialData
    ? {
        ...initialData,
        description: initialData.description || undefined,  // Convert null to undefined
        manualUrl: initialData.manualUrl || undefined,      // Convert null to undefined
        manualType: initialData.manualType || undefined,    // Convert null to undefined
        requiredForRoles: initialData.requiredForRoles,
        associatedEquipmentType: initialData.associatedEquipmentTypes || [],
      }
    : {
        name: "",
        description: "",
        manualUrl: "",
        manualType: undefined,
        requiredForRoles: [],
        associatedEquipmentType: [],
        frequency: SafetyTestFrequency.ONE_TIME,
      },
});

useEffect(() => {
  if (initialData) {
    form.reset({
      ...initialData,
      description: initialData.description || undefined,  // Convert null to undefined
      manualUrl: initialData.manualUrl || '',            // Convert null to empty string
      manualType: initialData.manualType || undefined,   // Convert null to undefined
      requiredForRoles: initialData.requiredForRoles,
      associatedEquipmentType: initialData.associatedEquipmentTypes || [],
    });
    setUploadedFileUrl(initialData.manualUrl || undefined);
  } else {
    form.reset({
      name: "",
      description: "",
      manualUrl: "",
      manualType: undefined,
      requiredForRoles: [],
      associatedEquipmentType: [],
      frequency: SafetyTestFrequency.ONE_TIME,
    });
    setUploadedFileUrl(undefined);
  }
}, [initialData, form]);

  const handleUploadComplete = (urls: string[]) => {
    if (urls.length > 0) {
      setUploadedFileUrl(urls[0]);
      form.setValue("manualUrl", urls[0]);
      form.trigger("manualUrl"); // Trigger validation for manualUrl
    } else {
      setUploadedFileUrl(undefined);
      form.setValue("manualUrl", "");
      form.trigger("manualUrl");
    }
  };

  const onSubmit = async (values: SafetyTestFormValues) => {
    setLoading(true);
    try {
      let response;
      const dataToSubmit = { ...values, manualUrl: uploadedFileUrl || '' };

      if (initialData) {
        response = await onSubmitAction({ id: initialData.id, ...dataToSubmit });
      } else {
        response = await onSubmitAction(dataToSubmit);
      }
      onFormSuccess(response);
    } catch (error: any) {
      toast.error("Failed to save SOP Manual.", {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Dummy data for associatedEquipmentTypes for now
  const availableEquipmentTypes = [
    "Microscope", "Centrifuge", "Spectrophotometer", "PCR Machine", "Incubator", "Autoclave", "Fume Hood"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SOP Name</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="e.g., Microscope Operation SOP" {...field} />
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
                <Textarea disabled={loading} placeholder="Brief description of the SOP" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Manual/Video Upload</FormLabel>
          <MultiFileUpload onUploadComplete={handleUploadComplete} maxFiles={1} />
          {uploadedFileUrl && (
            <p className="text-sm text-muted-foreground">
              Current Manual: <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{uploadedFileUrl}</a>
            </p>
          )}
          <FormMessage>{form.formState.errors.manualUrl?.message}</FormMessage>
        </FormItem>
        <FormField
          control={form.control}
          name="manualType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manual Type</FormLabel>
              <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manual type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(ManualType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
  name="requiredForRoles"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Required For Roles</FormLabel>
      <Select
        disabled={loading}
        onValueChange={(value) => {
  const currentValues = field.value || [];
  const role = value as UserRole;
  if (currentValues.includes(role)) {
    field.onChange(currentValues.filter((v) => v !== role));
  } else {
    field.onChange([...currentValues, role]);
  }
}}
        value=""
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select roles" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {Object.values(UserRole).map((role) => (
            <SelectItem key={role} value={role}>
              {role.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="mt-2">
        {field.value?.map((role) => (
          <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mr-2">
            {role.replace(/_/g, ' ')}
            <button
              type="button"
              className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary hover:bg-primary/20"
              onClick={(e) => {
                e.preventDefault();
                field.onChange(field.value.filter((r) => r !== role));
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
        <FormField
          control={form.control}
          name="associatedEquipmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Equipment Types</FormLabel>
              <div>
                <Select
                  disabled={loading}
                  onValueChange={(value) => {
                    const currentValues = field.value || [];
                    if (currentValues.includes(value)) {
                      field.onChange(currentValues.filter((v) => v !== value));
                    } else {
                      field.onChange([...currentValues, value]);
                    }
                  }}
                  value=""
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment types" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableEquipmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.value?.map((type) => (
                    <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {type}
                      <button
                        type="button"
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary hover:bg-primary/20"
                        onClick={(e) => {
                          e.preventDefault();
                          field.onChange((field.value || []).filter((t) => t !== type));
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(SafetyTestFrequency).map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onFormCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : initialData ? "Save Changes" : "Create SOP"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
