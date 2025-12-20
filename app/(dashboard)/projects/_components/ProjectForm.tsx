"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { ProjectFormValues } from '@/lib/actions/project';
import { ProjectWithDetails } from '@/types/project';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectStatus, UserRole } from '@prisma/client';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { handleCreateProject, handleUpdateProject } from '../_actions'; // Import new server actions

interface ProjectFormProps {
  initialData?: ProjectWithDetails;
  projectId?: string;
}

// Form schema for validation
const projectFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(ProjectStatus), // Remove .default() to make it required
  userEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  projectImage: z.any().optional(), // Add this if it's in ProjectFormValues
});

export function ProjectForm({ initialData, projectId }: ProjectFormProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdminOrManager = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.LAB_MANAGER;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description || '',
      startDate: initialData.startDate ? format(new Date(initialData.startDate), 'yyyy-MM-dd') : '',
      endDate: initialData.endDate ? format(new Date(initialData.endDate), 'yyyy-MM-dd') : '',
      status: initialData.status,
      userEmail: initialData.creator.email, // Assuming creator email is the assigned user email
    } : {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: ProjectStatus.PENDING,
      userEmail: '',
    },
  });

  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors }, 
    watch, 
    setError 
  } = form;

  const onSubmit = async (data: ProjectFormValues) => {
    if (!session?.user?.id) {
      toast.error('Authentication required', {
        description: 'You must be logged in to create/update a project.',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (initialData) {
        // Update existing project
        if (!projectId) {
          throw new Error("Project ID is required for updating.");
        }
        await handleUpdateProject(projectId, data); // Call server action
        toast.success('Project updated successfully', {
          description: `"${data.title}" has been updated.`,
        });
      } else {
        // Create new project
        await handleCreateProject(data); // Call server action
        toast.success('Project created successfully', {
          description: `"${data.title}" has been created.`,
        });
      }
      
      // Redirection is now handled by the server actions
      router.refresh(); // Refresh the router to reflect changes and trigger re-fetch if needed
      
    } catch (error: any) {
      console.error('Error creating/updating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Handle specific error messages
      if (errorMessage.includes("Assigned user not found.")) {
        setError('userEmail', {
          type: 'manual',
          message: "User with this email not found."
        });
      }

      toast.error('Failed to save project', {
        description: errorMessage.includes('\n') ? (
          <div className="whitespace-pre-line text-sm">{errorMessage}</div>
        ) : (
          <span className="text-sm">{errorMessage}</span>
        ),
        duration: errorMessage.includes('\n') ? 15000 : 8000,
        className: 'bg-red-50 border-red-200 text-red-800',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? 'Edit Project' : 'Create a New Project'}</CardTitle>
        <CardDescription>
          {initialData ? 'Edit the details of your project.' : 'Fill in the details below to create a new project. All fields marked with * are required.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter project title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  min={watch('startDate') || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {isAdminOrManager && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ProjectStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">Assign to User (Optional)</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="user@example.com"
                    {...register('userEmail')}
                  />
                  {errors.userEmail && (
                    <p className="text-sm text-red-500">{errors.userEmail.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Save Changes' : 'Create Project'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}