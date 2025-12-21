
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, UserRole } from "@prisma/client";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal("")),
  role: z.nativeEnum(UserRole),
  phoneNumber: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  profileImage: z.string().url("Invalid URL").optional().or(z.literal("")),
  employeeId: z.string().optional().or(z.literal("")),
  studentId: z.string().optional().or(z.literal("")),
  yearOfStudy: z.number().int().positive("Year of study must be a positive number.").optional().nullable(),
  program: z.string().optional().or(z.literal("")),
});

export type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  initialData?: User;
  onSubmit: (values: UserFormValues) => void;
}

export function UserForm({ initialData, onSubmit }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      email: initialData.email,
      role: initialData.role,
      phoneNumber: initialData.phoneNumber || "",
      department: initialData.department || "",
      position: initialData.position || "",
      profileImage: initialData.profileImage || "",
      employeeId: initialData.employeeId || "",
      studentId: initialData.studentId || "",
      yearOfStudy: initialData.yearOfStudy || undefined,
      program: initialData.program || "",
    } : {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: UserRole.STUDENT,
      phoneNumber: "",
      department: "",
      position: "",
      profileImage: "",
      employeeId: "",
      studentId: "",
      yearOfStudy: undefined,
      program: "",
    },
  });



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., +1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Computer Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Research Assistant" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profileImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/profile.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., EMP001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., STU001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearOfStudy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year of Study</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    {...field}
                    value={field.value ?? ""}
                    onChange={event => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="program"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Electrical Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} disabled={!!initialData} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!initialData && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {initialData ? "Save Changes" : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
