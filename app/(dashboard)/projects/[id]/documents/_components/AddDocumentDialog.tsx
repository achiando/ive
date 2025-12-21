"use client";

import { MultiFileUpload } from "@/components/ui/multi-file-upload";
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
  fileUrls: z.array(z.string().url("Please enter a valid URL.")).optional(),
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
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);

  const form = useForm<AddDocumentFormValues>({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      fileName: '',
      fileType: ManualType.LINK,
    },
  });

  const { formState: { isSubmitting } } = form;

  const handleUploadComplete = (urls: string[]) => {
    setUploadedFileUrls(urls);
    // Optionally, set the first URL to the form's fileUrl if you want to keep a single file concept for the form
    // form.setValue("fileUrl", urls[0]);
  };

  const onSubmit = async (values: AddDocumentFormValues) => {
    if (uploadedFileUrls.length === 0) {
      toast.error('Please upload at least one file.');
      return;
    }

    try {
      for (const url of uploadedFileUrls) {
        const newDocument = await addProjectDocumentAction(projectId, values.fileName, url, values.fileType);
        onDocumentAdded(newDocument);
      }
      toast.success('Document(s) added successfully.');
      form.reset();
      setUploadedFileUrls([]);
      setIsOpen(false);
    } catch (error: any) {
      toast.error('Failed to add document(s).', {
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
          <DialogDescription>Upload the document(s) you want to add to this project.</DialogDescription>
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
            <MultiFileUpload onUploadComplete={handleUploadComplete} />
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
              <Button type="submit" disabled={isSubmitting || uploadedFileUrls.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Document(s)...
                  </>
                ) : 'Add Document(s)'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
