"use client";

import { AlertTriangle, Eye, Image as ImageIcon, PackageCheck, PackageMinus, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsumableWithRelations } from "@/types/consumable"; // Import the new type

interface ConsumableCardProps {
  consumable: ConsumableWithRelations;
}

export function ConsumableCard({ consumable }: ConsumableCardProps) {
  const imageUrl = consumable.image || '/image.png'; // Placeholder image

  const isLowStock = useMemo(() => 
    consumable.currentStock <= consumable.minimumStock && consumable.currentStock > 0,
    [consumable.currentStock, consumable.minimumStock]
  );

  const isOutOfStock = useMemo(() => 
    consumable.currentStock === 0,
    [consumable.currentStock]
  );
  
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md">
      <div className="relative h-40 w-full bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={consumable.name || 'Consumable image'}
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
          <CardTitle className="text-lg line-clamp-2">{consumable.name}</CardTitle>
          <div className="flex-shrink-0 flex flex-wrap gap-1 justify-end">
            {isOutOfStock ? (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <PackageMinus className="h-3 w-3" />
                <span className="hidden sm:inline">Out of Stock</span>
              </Badge>
            ) : isLowStock ? (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs bg-yellow-500 text-white">
                <AlertTriangle className="h-3 w-3" />
                <span className="hidden sm:inline">Low Stock</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-green-500 text-white">
                <PackageCheck className="h-3 w-3" />
                <span className="hidden sm:inline">In Stock</span>
              </Badge>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {consumable.category.replace(/_/g, ' ')}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Current Stock:</span> {consumable.currentStock} {consumable.unit}
          </div>
          <div className="text-sm">
            <span className="font-medium">Min Stock:</span> {consumable.minimumStock} {consumable.unit}
          </div>
          {consumable.location && (
            <div className="text-sm">
              <span className="font-medium">Location:</span> {consumable.location}
            </div>
          )}
          {consumable.supplier && (
            <div className="text-sm">
              <span className="font-medium">Supplier:</span> {consumable.supplier}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between sm:flex-row gap-2 pt-2">
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/consumables/${consumable.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/consumables/${consumable.id}/view`}> {/* Assuming a view page exists */}
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
