'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { programs } from '@/data/program';
import { UserRole } from '@prisma/client';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';


const ROLE_OPTIONS = [
  { value: UserRole.STUDENT, label: 'Student' },
  { value: UserRole.FACULTY, label: 'Faculty' },
  // { value: UserRole.LECTURER, label: 'Lecturer' },
  { value: UserRole.OTHER, label: 'Other' }
];

interface UserDetailsStepProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    role?: UserRole;
    yearOfStudy?: number;
    acceptTerms: boolean;
    studentId?: string;
    affiliatedInstitution?: string;
    associatedInstructor?: string;
    program?: string;
  };
  updateFormData: (data: Record<string, any>) => void;
  errors: Record<string, string>;
  isSubmitting?: boolean;
}

export function UserDetailsStep({ formData, updateFormData, errors, isSubmitting = false }: UserDetailsStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleRoleChange = (value: string) => {
    const newRole = value as UserRole;
    if (newRole === UserRole.STUDENT && formData.email && !formData.email.endsWith('@students.ku.ac.ke')) {
      setShowEmailAlert(true);
    } else {
      setShowEmailAlert(false);
    }

    if (Object.values(UserRole).includes(newRole)) {
      updateFormData({ role: newRole });
    } else {
      updateFormData({ role: undefined });
    }
  };

  const checkCredentials = async (field: 'email' | 'studentId', value: string) => {
    if (!value || value.length < 3) return;
    
    const params = new URLSearchParams();
    if (field === 'email' && value) params.set('email', value);
    if (field === 'studentId' && value) params.set('studentId', value);

    try {
      setIsChecking(true);
      const response = await fetch(`/api/auth/check-credentials?${params.toString()}`);
      const data = await response.json();
      
      if (data.emailExists) {
        updateFormData({ errors: { ...errors, email: 'This email is already registered' } });
      }
      if (data.studentIdExists) {
        updateFormData({ errors: { ...errors, studentId: 'This student ID is already registered' } });
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    if (formData.role === UserRole.STUDENT && newEmail && !newEmail.endsWith('@students.ku.ac.ke')) {
      setShowEmailAlert(true);
    } else {
      setShowEmailAlert(false);
    }
    updateFormData({ email: newEmail });
    if (newEmail.length > 3) {
      checkCredentials('email', newEmail);
    }
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStudentId = e.target.value;
    updateFormData({ studentId: newStudentId });
    if (newStudentId.length > 3) {
      checkCredentials('studentId', newStudentId);
    }
  };

  return (
    <div className="space-y-4">
      {showEmailAlert && (
        <Alert variant="destructive">
          <AlertTitle>Invalid Email for Student Role</AlertTitle>
          <AlertDescription>
            Students must use their <span className='font-medium'>@students.ku.ac.ke</span> email address.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            disabled={isSubmitting}
            placeholder="John"
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            placeholder="Doe"
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={handleEmailChange}
              onBlur={(e) => checkCredentials('email', e.target.value)}
              placeholder="Enter your email"
              className={`${errors.email ? 'border-red-500' : ''} pr-10`}
              required
            />
            {isChecking && formData.email.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
              </div>
            )}
          </div>
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          <p className="text-xs text-muted-foreground mt-1">Students must use their <span className='font-medium'>@students.ku.ac.ke</span> email address.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber || ''}
            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
            placeholder="e.g. +1234567890"
            className={errors.phoneNumber ? 'border-red-500' : ''}
            required
          />
          {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
        </div>


        <div className="space-y-2">
          <Label htmlFor="program">Program *</Label>
          <Select
            value={formData.program || ''}
            onValueChange={(value: string) => updateFormData({ program: value })}
          >
            <SelectTrigger className={errors.program ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select your program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program} value={program}>
                  {program}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.program && <p className="text-sm text-red-500">{errors.program}</p>}
        </div>

        <div className="space-y-2 ml-4">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role || ''}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
        </div>
      </div>

      {formData.role === UserRole.STUDENT && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID *</Label>
            <Input
              id="studentId"
              value={formData.studentId || ''}
              onChange={(e) => updateFormData({ studentId: e.target.value })}
              placeholder="123456"
              className={errors.studentId ? 'border-red-500' : ''}
            />
            {errors.studentId && <p className="text-sm text-red-500">{errors.studentId}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearOfStudy">Year of Study *</Label>
            <Select
              value={formData.yearOfStudy ? String(formData.yearOfStudy) : ''}
              onValueChange={(value) => updateFormData({ yearOfStudy: parseInt(value, 10) })}
            >
              <SelectTrigger className={errors.yearOfStudy ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.yearOfStudy && <p className="text-sm text-red-500">{errors.yearOfStudy}</p>}
          </div>
        </div>
      )}

      {
        formData.role === UserRole.OTHER && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="associatedInstructor">Associated Instructor *</Label>
              <Input
                id="associatedInstructor"
                value={formData.associatedInstructor || ''}
                onChange={(e) => updateFormData({ associatedInstructor: e.target.value })}
                placeholder="Enter associated instructor name"
                className={errors.associatedInstructor ? 'border-red-500' : ''}
              />
              {errors.associatedInstructor && <p className="text-sm text-red-500">{errors.associatedInstructor}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliatedInstitution">Affiliated Institution *</Label>
              <Input
                id="affiliatedInstitution"
                value={formData.affiliatedInstitution || ''}
                onChange={(e) => updateFormData({ affiliatedInstitution: e.target.value })}
                placeholder="Enter affiliated institution name"
                className={errors.affiliatedInstitution ? 'border-red-500' : ''}
              />
              {errors.affiliatedInstitution && <p className="text-sm text-red-500">{errors.affiliatedInstitution}</p>}
            </div>
          </div>
        )
      }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={(e) => updateFormData({ password: e.target.value })}
              placeholder="••••••••"
              className={`${errors.password ? 'border-red-500' : ''} pr-10`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword || ''}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              placeholder="••••••••"
              className={`${errors.confirmPassword ? 'border-red-500' : ''} pr-10`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
        <p className="text-sm text-yellow-600">
          Passwords don't match
        </p>
      )}

      <div className="pt-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => updateFormData({ acceptTerms: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="acceptTerms" className="font-medium text-gray-700">
              I accept the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                Terms and Conditions
              </a>
            </label>
            {errors.acceptTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}