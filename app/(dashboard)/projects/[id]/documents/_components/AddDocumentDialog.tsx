"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { File as FileIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ManualType } from '@prisma/client';
import { useState } from 'react';

const addDocumentSchema = z.object({
  fileName: z.string().min(1, "File name is required."),
  fileUrl: z.string().url("Please enter a valid URL."),
  fileType: z.nativeEnum(ManualType),
});

type AddDocumentFormValues = z.infer<typeof addDocumentSchema>;

interface AddDocumentDialogProps {
  projectId: string;
  onDocumentAdded: (document: any) => void;
  addProjectDocumentAction: (projectId: string, fileName: string, fileUrl: string, fileType: ManualType) => Promise<any>;
}

export function AddDocumentDialog({ projectId, onDocumentAdded, addProjectDocumentAction }: AddDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<AddDocumentFormValues>({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      fileName: '',
      fileUrl: '',
      fileType: ManualType.LINK,
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: AddDocumentFormValues) => {
    try {
      const newDocument = await addProjectDocumentAction(projectId, values.fileName, values.fileUrl, values.fileType);
      toast.success('Document added successfully.');
      onDocumentAdded(newDocument);
      form.reset();
      setIsOpen(false);
    } catch (error: any) {
      toast.error('Failed to add document.', {
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FileIcon className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>Enter the details of the document you want to add to this project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fileName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Proposal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/document.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a file type" />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : 'Upload Document'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
