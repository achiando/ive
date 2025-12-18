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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getClients } from "@/lib/actions/client"; // Import from client actions
import { getProjects } from "@/lib/actions/project"; // Import from project actions
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

// Define the schema for a single item
const itemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.number().min(0, "Amount must be positive."),
});

// Define the main form schema
const formSchema = z.object({
  id: z.string().min(1, "Invoice ID is required."),
  clientId: z.string().optional(), // New optional field
  projectId: z.string().optional(), // New optional field
  date: z.date({ message: "Invoice date is required." }),
  dueDate: z.date({ message: "Due date is required." }),
  status: z.enum(["paid", "unpaid"]),
  items: z.array(itemSchema).min(1, "At least one item is required."),
});

export type InvoiceFormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  initialData?: InvoiceFormValues & { clientRel?: { id: string; name: string } | null; projectRel?: { id: string; name: string } | null; };
  onSubmit: (values: InvoiceFormValues) => void;
}

export function InvoiceForm({ initialData, onSubmit }: InvoiceFormProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      const fetchedClients = await getClients();
      setClients(fetchedClients);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    }
    fetchData();
  }, []);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          date: new Date(initialData.date),
          dueDate: new Date(initialData.dueDate),
          clientId: initialData.clientRel?.id || undefined,
          projectId: initialData.projectRel?.id || undefined,
        }
      : {
          id: "",
          clientId: undefined,
          projectId: undefined,
          date: new Date(),
          dueDate: new Date(),
          status: "unpaid",
          items: [{ description: "", amount: 0 }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Main Details Column */}
          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Meta Details Column */}
          <div className="space-y-8 rounded-lg border bg-gray-50 p-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. INV-002" {...field} disabled={!!initialData} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Invoice Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                        selected={field.value}
                        onSelect={field.onChange}
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
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Invoice Items */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Invoice Items</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-4 rounded-md border p-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-5">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Item description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mt-8"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ description: "", amount: 0 })}
          >
            Add Item
          </Button>
        </div>

        <Button type="submit">
          {initialData ? "Save Changes" : "Create Invoice"}
        </Button>
      </form>
    </Form>
  );
}