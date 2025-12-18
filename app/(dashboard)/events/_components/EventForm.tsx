
"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Event } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(1, "Event name is required."),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  venue: z.string().optional(),
  maxParticipants: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  createdById: z.string().min(1, "Creator ID is required."),
});

export type EventFormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  initialData?: Event;
  onSubmit: (values: EventFormValues) => void;
  createdById: string; // Pass the ID of the user creating/editing the event
}

export function EventForm({ initialData, onSubmit, createdById }: EventFormProps) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          startDate: initialData.startDate.toISOString(),
          endDate: initialData.endDate.toISOString(),
          maxParticipants: initialData.maxParticipants || undefined,
          imageUrl: initialData.imageUrl || undefined,
        }
      : {
          name: "",
          description: "",
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          venue: "",
          maxParticipants: undefined,
          imageUrl: "",
          createdById: createdById,
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
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
                <Textarea placeholder="Enter event description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={(date) => field.onChange(date?.toISOString() || "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={(date) => field.onChange(date?.toISOString() || "")}
                      initialFocus
                      disabled={(date) =>
                        form.watch("startDate")
                          ? date < new Date(form.watch("startDate"))
                          : false
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Auditorium" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxParticipants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Participants</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="e.g., https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {initialData ? "Save Changes" : "Create Event"}
        </Button>
      </form>
    </Form>
  );
}
