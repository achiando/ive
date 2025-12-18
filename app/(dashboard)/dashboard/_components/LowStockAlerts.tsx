import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LowStockAlertsProps {
  consumables: any[];
  isLoading: boolean;
}

export function LowStockAlerts({ consumables, isLoading }: LowStockAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
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
        <CardTitle>Low Stock Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {consumables.length > 0 ? (
          <ul>
            {consumables.map((item) => (
              <li key={item.id}>{item.name} - {item.currentStock} left</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No low stock alerts.</p>
        )}
      </CardContent>
    </Card>
  );
}
