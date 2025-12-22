
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { registerForEvent } from "@/lib/actions/event-participation";
import { Event } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface EventRegistrationFormProps {
  event: Event;
  isRegistered: boolean;
  asGuest?: boolean;
}

export function EventRegistrationForm({ event, isRegistered, asGuest = false }: EventRegistrationFormProps) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(asGuest);

  const handleRegister = async () => {
    if (user) {
      await handleUserRegistration();
    } else if (showGuestForm) {
      await handleGuestRegistration();
    } else {
      setShowGuestForm(true);
    }
  };

  const handleUserRegistration = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await registerForEvent(event.id, user.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestRegistration = async () => {
    if (!guestName || !guestEmail) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerForEvent(event.id, undefined, guestEmail, guestName);
      if (result.success) {
        toast.success("Successfully registered for the event!");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Checking your session and registration status.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register for {event.name}</CardTitle>
        <CardDescription>
          {event.description || "No description available."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRegistered ? (
          <div className="text-center text-green-600 font-semibold">
            You are already registered for this event!
            <Button asChild className="mt-4 w-full">
              <Link href={`/events/${event.id}/view`}>View Event Details</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {user 
                ? `You're logged in as ${user.name || user.email}. Click below to register.`
                : showGuestForm 
                  ? "Please enter your details to register as a guest."
                  : `Register for ${event.name} as a guest or log in to your account.`
              }
            </p>

            {showGuestForm && !user && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Full Name *</Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email *</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleRegister} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading 
                ? "Registering..." 
                : user 
                  ? "Register Now" 
                  : showGuestForm 
                    ? "Register as Guest"
                    : "Continue as Guest"}
            </Button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                {!showGuestForm && (
                  <>
                    Already have an account?{' '}
                    <Link 
                      href={`/api/auth/signin?callbackUrl=/events/${event.id}/register`} 
                      className="text-primary hover:underline"
                    >
                      Log in
                    </Link>
                  </>
                )}
                {showGuestForm && (
                  <button 
                    onClick={() => setShowGuestForm(false)}
                    className="text-primary hover:underline"
                  >
                    Back to login options
                  </button>
                )}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
