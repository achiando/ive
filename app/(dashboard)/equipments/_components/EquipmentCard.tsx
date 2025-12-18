// 
import { AlertTriangle, Eye, FileText, Image as ImageIcon, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentWithRelations } from "@/types/equipment";
import { UserRole } from "@prisma/client";

interface EquipmentCardProps {
  equipment: EquipmentWithRelations;
  userRole: UserRole;
}

export function EquipmentCard({ equipment, userRole }: EquipmentCardProps) {
  const isAdmin = useMemo(() => 
    userRole === 'ADMIN' || userRole === 'LAB_MANAGER',
    [userRole]
  );

  const isTechnician = useMemo(() => 
    userRole === 'TECHNICIAN' ,
    [userRole]
  );

const needsMaintenance = useMemo(() => 
  (equipment.maintenances as Array<{ status: string }> | undefined)?.some(
    m => m.status === 'PENDING' || m.status === 'OVERDUE'
  ),
  [equipment.maintenances]
);
  
  const imageUrl = equipment.image || '/image.png';

  const showAdvancedInfo = isTechnician || isAdmin;

  return (
    <>
      <Card className="h-full flex flex-col transition-all hover:shadow-md">
        <div className="relative h-40 w-full bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={equipment.name || 'Equipment image'}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg line-clamp-2">{equipment.name}</CardTitle>
            <div className="flex-shrink-0 flex flex-wrap gap-1 justify-end">
              {needsMaintenance && (
                <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                  <Wrench className="h-3 w-3" />
                  <span className="hidden sm:inline">Maintenance</span>
                </Badge>
              )}
              {equipment.requiresSafetyTest && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="hidden sm:inline">Test Required</span>
                </Badge>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {equipment.model} • {equipment.status}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Location:</span> {equipment.location || 'N/A'}
            </div>
            
            {showAdvancedInfo && (
              <>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <Badge variant="outline" className="ml-1">
                    {equipment.status}
                  </Badge>
                </div>
                {equipment.dailyCapacity !== undefined && ( // Changed from quantity to dailyCapacity
                  <div className="text-sm">
                    <span className="font-medium">Daily Capacity:</span> {equipment.dailyCapacity} {/* Changed label */}
                  </div>
                )}
              </>
            )}

            {isAdmin && (
              <div className="text-sm">
                <span className="font-medium">Serial:</span> {equipment.serialNumber || 'N/A'}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between sm:flex-row gap-2 pt-2">
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/equipments/${equipment.id}/view`}> {/* Corrected Link href */}
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </Button>
          </div>
          <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/manager/sop-manuals">
                <FileText className="mr-2 h-4 w-4" />
                Safety Tests
              </Link>
            </Button>
        </CardFooter>
      </Card>
        
    </>
  );
}