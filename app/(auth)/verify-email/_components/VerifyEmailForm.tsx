'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

function VerifyEmailFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || token.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      toast.success(data.message || 'Verification successful!');
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      // Note: This API endpoint needs to be created.
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code.');
      }

      toast.success(data.message || 'A new verification code has been sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to{' '}
          <span className="font-semibold text-primary">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input
            id="verification-code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456"
            maxLength={6}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <Button type="submit" disabled={isSubmitting || !token} className="w-full py-4">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
          ) : (
            'Verify Account'
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <p>Didn't receive the code?</p>
        <Button
          variant="link"
          onClick={handleResendCode}
          disabled={isResending}
          className="font-semibold"
        >
          {isResending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
          ) : (
            'Click to resend'
          )}
        </Button>
      </div>
    </div>
  );
}

// Wrap the component in Suspense to handle the useSearchParams() hook
export function VerifyEmailForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailFormComponent />
    </Suspense>
  );
}
