import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceAlertsProps {
  maintenanceItems: any[];
  isLoading: boolean;
  showAssignedOnly?: boolean;
}

export function MaintenanceAlerts({ maintenanceItems, isLoading, showAssignedOnly }: MaintenanceAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Alerts</CardTitle>
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
        <CardTitle>Maintenance Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {maintenanceItems.length > 0 ? (
          <ul>
            {maintenanceItems.map((item) => (
              <li key={item.id}>{item.equipment?.name || 'Item'} - {item.status}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No pending maintenance alerts.</p>
        )}
      </CardContent>
    </Card>
  );
}
