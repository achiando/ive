'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { updateUserSelections } from "@/lib/actions/user";
import { cn } from "@/lib/utils";
import { EquipmentWithRelations } from "@/types/equipment";
import { Event } from "@prisma/client";
import { Calendar, CheckCircle2, ChevronDown, Clock, Cpu, Loader2, Lock, Plus, RefreshCw } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ViewMode = 'summary' | 'add-event' | 'add-equipment';

interface EventWithCount extends Event {
  _count?: {
    participants: number;
  };
}

interface PendingPageClientProps {
  initialEvents: EventWithCount[];
  initialEquipment: EquipmentWithRelations[];
  initialUserSelections: {
    events: Event[];
    equipment: EquipmentWithRelations[];
  };
  session: Session | null;
}

export function PendingPageClient({
  initialEvents,
  initialEquipment,
  initialUserSelections,
  session,
}: PendingPageClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [availableEvents, setAvailableEvents] = useState<EventWithCount[]>(initialEvents);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentWithRelations[]>(initialEquipment);

  const [selectedEvents, setSelectedEvents] = useState<Event[]>(initialUserSelections.events);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithRelations[]>(initialUserSelections.equipment);

  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (session?.user?.status === 'APPROVED') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  const toggleEventSelection = (event: Event) => {
    const isSelected = selectedEvents.some(e => e.id === event.id);
    if (isSelected) {
      setSelectedEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success('Event removed');
    } else {
      setSelectedEvents(prev => [...prev, event]);
      toast.success('Event added');
    }
  };

  const toggleEquipmentSelection = (equipment: EquipmentWithRelations) => {
    const isSelected = selectedEquipment.some(e => e.id === equipment.id);
    if (isSelected) {
      setSelectedEquipment(prev => prev.filter(e => e.id !== equipment.id));
      toast.success('Equipment removed');
    } else {
      setSelectedEquipment(prev => [...prev, equipment]);
      toast.success('Equipment added');
    }
  };

  const handleSaveSelections = async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to save selections.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await updateUserSelections(
        session.user.id,
        selectedEvents.map(e => e.id),
        selectedEquipment.map(e => e.id)
      );

      if (result.success) {
        toast.success('Selections saved successfully');
        setViewMode('summary');
      } else {
        throw new Error(result.message || 'Failed to save selections');
      }
    } catch (error) {
      console.error('Error saving selections:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save selections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      // No direct update() call needed for custom useSession, it will react to session changes
      const response = await fetch('/api/auth/session'); // Fetch latest session data
      
      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }
      
      const data = await response.json();
      
      if (data.user?.status === 'APPROVED') {
        toast.success('Your account has been approved!');
        router.push('/dashboard');
        return;
      }
      
      toast.info('Status refreshed. Your account is still pending approval.');
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error('Failed to refresh status. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderLoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <span className="ml-4 text-gray-600">Loading...</span>
    </div>
  );

  if (!mounted) {
    return renderLoadingState();
  }
  
  if (session?.user?.status === 'APPROVED') {
    // This will be handled by the useEffect redirect, but as a fallback:
    return (
        <div className="min-h-screen bg-white flex flex-col justify-center items-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="mt-4 text-lg text-gray-600">Redirecting to your dashboard...</p>
        </div>
    );
  }

  const renderContent = () => {
    if (viewMode === 'summary') {
      return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Registration Summary</h1>
                    <p className="text-lg text-gray-600 mt-1">
                        You can select events and equipment while your account is under review.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Items
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setViewMode('add-event')}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Add Events
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem onClick={() => setViewMode('add-equipment')}>
                                <Cpu className="mr-2 h-4 w-4" />
                                Add Equipment
                            </DropdownMenuItem> */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Selections */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="space-y-6">
                    {/* Selected Events */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selected Events</h3>
                        {selectedEvents.length > 0 ? (
                            <div className="space-y-2">
                                {selectedEvents.map((event) => (
                                    <div key={event.id} className="flex justify-between items-center p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{event.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(event.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => toggleEventSelection(event)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-500">No events selected.</p>}
                        <Button variant="outline" className="mt-4 w-full" onClick={() => setViewMode('add-event')}>
                            <Plus className="mr-2 h-4 w-4" /> Add/View Events
                        </Button>
                    </div>

                    {/* Selected Equipment */}
                    {/* <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selected Equipment</h3>
                        {selectedEquipment.length > 0 ? (
                            <div className="space-y-2">
                                {selectedEquipment.map((eq) => (
                                    <div key={eq.id} className="flex justify-between items-center p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{eq.name}</p>
                                            <p className="text-sm text-gray-500">{eq.model}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => toggleEquipmentSelection(eq)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-500">No equipment selected.</p>}
                        <Button variant="outline" className="mt-4 w-full" onClick={() => setViewMode('add-equipment')}>
                            <Plus className="mr-2 h-4 w-4" /> Add/View Equipment
                        </Button>
                    </div> */}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveSelections} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Selections
                    </Button>
                </div>
            </div>
        </div>
      );
    }
    
    if (viewMode === 'add-event') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Add Events</h2>
                    <Button variant="outline" onClick={() => setViewMode('summary')}>
                        Back to Summary
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {availableEvents.map((event) => (
                        <Card key={event.id} className={cn("hover:shadow-md transition-shadow", selectedEvents.some(e => e.id === event.id) && "border-blue-500")}>
                            <CardHeader>
                                <CardTitle>{event.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">{event.description}</p>
                                <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(event.startDate).toLocaleDateString()}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={selectedEvents.some(e => e.id === event.id) ? 'secondary' : 'default'}
                                    onClick={() => toggleEventSelection(event)}
                                >
                                    {selectedEvents.some(e => e.id === event.id) ? 'Remove' : 'Add Event'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setViewMode('summary')}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSelections} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Selections
                  </Button>
                </div>
            </div>
        );
    }
    
    if (viewMode === 'add-equipment') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Add Equipment</h2>
                    <Button variant="outline" onClick={() => setViewMode('summary')}>
                        Back to Summary
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {availableEquipment.map((equipment) => (
                        <Card key={equipment.id} className={cn("hover:shadow-md transition-shadow", selectedEquipment.some(e => e.id === equipment.id) && "border-blue-500")}>
                            <CardHeader>
                                <CardTitle>{equipment.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">{equipment.description}</p>
                                <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <Cpu className="h-4 w-4 mr-1" />
                                    {equipment.model || 'N/A'}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={selectedEquipment.some(e => e.id === equipment.id) ? 'secondary' : 'default'}
                                    onClick={() => toggleEquipmentSelection(equipment)}
                                >
                                    {selectedEquipment.some(e => e.id === equipment.id) ? 'Remove' : 'Add Equipment'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setViewMode('summary')}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSelections} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Selections
                  </Button>
                </div>
            </div>
        );
    }
  };

  const steps = [
    { id: 'submitted', name: 'Application Submitted', description: 'Your registration has been received', status: 'complete', icon: CheckCircle2 },
    { id: 'review', name: 'Under Review', description: 'Our team is reviewing your application', status: 'current', icon: Clock },
    { id: 'approved', name: 'Approval', description: 'Account activation', status: 'upcoming', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Account Under Review
            </h1>
            <p className="mt-3 text-xl text-gray-500">
              We're currently reviewing your registration. You can check your status or sign out.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-16">
            <nav aria-label="Progress">
              <ol className="space-y-6">
                {steps.map((step, stepIdx) => (
                  <li key={step.name} className="relative flex items-start">
                    {stepIdx !== steps.length - 1 ? (
                      <div className="absolute left-5 top-5 -ml-px mt-1 w-0.5 h-full bg-gray-300" aria-hidden="true" />
                    ) : null}
                    <div className="flex items-center">
                        <span className={cn("h-10 w-10 rounded-full flex items-center justify-center",
                            step.status === 'complete' ? 'bg-blue-600' : 'border-2 border-gray-300',
                            step.status === 'current' && 'border-blue-600'
                        )}>
                            <step.icon className={cn("h-6 w-6",
                                step.status === 'complete' ? 'text-white' : 'text-gray-500',
                                step.status === 'current' && 'text-blue-600'
                            )} />
                        </span>
                        <div className="ml-4">
                            <h3 className={cn("text-sm font-medium", step.status === 'current' && 'text-blue-600')}>{step.name}</h3>
                            <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          
          {renderContent()}

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button 
                onClick={handleRefreshStatus} 
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking Status...' : 'Check Status'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full sm:w-auto"
              >
                Sign Out
              </Button>
            </div>

          <div className="mt-12 text-center">
            <h3 className="text-sm font-medium text-gray-900">Need help?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact our support team at{' '}
              <a href="mailto:ive@ku.ac.ke" className="text-blue-600 hover:text-blue-500">
                ive@ku.ac.ke
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
