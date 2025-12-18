import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HardDrive as Tool } from "lucide-react";

interface FullyBookedEquipmentProps {
  equipment: any[]; // TODO: Define a more specific type for equipment
  isLoading: boolean;
}

export function FullyBookedEquipment({ equipment, isLoading }: FullyBookedEquipmentProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fully Booked Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fully Booked Equipment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {equipment.length > 0 ? (
          equipment.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Tool className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{item.name}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No equipment is fully booked today.</p>
        )}
      </CardContent>
    </Card>
  );
}
