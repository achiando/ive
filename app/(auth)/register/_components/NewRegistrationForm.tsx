'use client';

import { Button } from '@/components/ui/button';
import { UserRole } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { UserDetailsStep } from './UserDetailsStep';

// Simplified form data interface
interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  acceptTerms: boolean;
  yearOfStudy?: number;
  studentId?: string;
  affiliatedInstitution?: string;
  associatedInstructor?: string;
  program?: string;
}

export function NewRegistrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: UserRole.STUDENT,
    acceptTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateFormData = useCallback((data: Partial<RegistrationFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const { firstName, lastName, email, phoneNumber, password, confirmPassword, acceptTerms } = formData;
    
    if (!firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+\.?$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.length < 10) {
      newErrors.phoneNumber = 'Phone number must be at least 10 digits';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare the data to send to the API
      // Include confirmPassword in the request as it's needed for validation
      const { confirmPassword, acceptTerms, ...submitData } = formData;
      
      if (submitData.yearOfStudy) {
        submitData.yearOfStudy = Number(submitData.yearOfStudy);
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      const responseData = await response.json();
      console.log('Registration response:', { status: response.status, data: responseData });
      
      if (!response.ok) {
        if (response.status === 400 && responseData.errors) {
          // Handle validation errors
          const errorMessages = Object.entries(responseData.errors)
            .map(([field, messages]) => {
              const messageList = Array.isArray(messages) ? messages.join(', ') : String(messages);
              return `${field}: ${messageList}`;
            })
            .join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        throw new Error(responseData.message || 'Registration failed');
      }
      
      // Redirect to verification page after successful registration
      toast.success(responseData.message || 'Registration successful! Please check your email for a verification code.');
      // router.push(`/verify-email?email=${formData.email}`);
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">
          We'll help you select events and equipment after registration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <UserDetailsStep 
          formData={formData}
          updateFormData={updateFormData}
          errors={errors}
          isSubmitting={isSubmitting}
        />
        
        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={isSubmitting} className='w-full py-4'>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
