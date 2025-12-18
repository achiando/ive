
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/useSession";
import { registerForEvent } from "@/lib/actions/event-participation";
import { toast } from "sonner";
import Link from "next/link";
import { Event } from "@prisma/client";

interface EventRegistrationFormProps {
  event: Event;
  isRegistered: boolean;
}

export function EventRegistrationForm({ event, isRegistered }: EventRegistrationFormProps) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please log in to register for the event.");
      router.push(`/api/auth/signin?callbackUrl=/events/${event.id}/register`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerForEvent(event.id, user.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh(); // Refresh to update registration status
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
              Click the button below to confirm your registration for {event.name}.
            </p>
            <Button onClick={handleRegister} disabled={isLoading || !user} className="w-full">
              {isLoading ? "Registering..." : "Register Now"}
            </Button>
            {!user && (
              <p className="text-center text-sm text-red-500">
                You must be logged in to register. <Link href={`/api/auth/signin?callbackUrl=/events/${event.id}/register`} className="underline">Log in</Link>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
