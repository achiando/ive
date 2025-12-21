"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { BulkConsumableInput } from "@/lib/actions/bulk-consumable";
import { ConsumableCategory, ConsumableStatus } from "@prisma/client"; // Import ConsumableStatus
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface FailedItem {
  row: number;
  data: BulkConsumableInput;
  errors: string[];
  isEditing: boolean;
  editedData: BulkConsumableInput;
}

interface FailedConsumableItemRowProps {
  item: FailedItem;
  onEditChange: (row: number, field: keyof BulkConsumableInput, value: any) => void;
  onToggleEdit: (row: number) => void;
  onToggleSelect: (row: number, isSelected: boolean) => void;
  isSelected: boolean;
}

export function FailedConsumableItemRow({
  item,
  onEditChange,
  onToggleEdit,
  onToggleSelect,
  isSelected,
}: FailedConsumableItemRowProps) {
  const [currentEditedData, setCurrentEditedData] = useState<BulkConsumableInput>(item.editedData || item.data);

  const handleFieldChange = (field: keyof BulkConsumableInput, value: any) => {
    const updatedData = { ...currentEditedData, [field]: value };
    setCurrentEditedData(updatedData);
    onEditChange(item.row, field, value);
  };

  const categories = Object.values(ConsumableCategory);
  const statuses = Object.values(ConsumableStatus);

  return (
    <TableRow className={item.errors.length > 0 ? "bg-red-50" : ""}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onToggleSelect(item.row, !!checked)}
        />
      </TableCell>
      <TableCell>{item.row}</TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            value={currentEditedData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
        ) : (
          item.data.name
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Select
            value={currentEditedData.category}
            onValueChange={(value: ConsumableCategory) => handleFieldChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          item.data.category
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            type="number"
            value={currentEditedData.quantity}
            onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value) || 0)} // Changed to parseInt
          />
        ) : (
          item.data.quantity
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            value={currentEditedData.unit || ''}
            onChange={(e) => handleFieldChange('unit', e.target.value)}
          />
        ) : (
          item.data.unit
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            type="number"
            value={currentEditedData.currentStock}
            onChange={(e) => handleFieldChange('currentStock', parseFloat(e.target.value) || 0)}
          />
        ) : (
          item.data.currentStock
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            type="number"
            value={currentEditedData.minimumStock}
            onChange={(e) => handleFieldChange('minimumStock', parseFloat(e.target.value) || 0)}
          />
        ) : (
          item.data.minimumStock
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Select
            value={currentEditedData.status}
            onValueChange={(value: ConsumableStatus) => handleFieldChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          item.data.status
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            type="date"
            value={currentEditedData.expiryDate ? new Date(currentEditedData.expiryDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange('expiryDate', e.target.value ? new Date(e.target.value) : undefined)}
          />
        ) : (
          item.data.expiryDate ? new Date(item.data.expiryDate).toLocaleDateString() : 'N/A'
        )}
      </TableCell>
      <TableCell className="text-red-500 text-sm">
        {item.errors.join(', ')}
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm" onClick={() => onToggleEdit(item.row)}>
          {item.isEditing ? 'Done' : 'Edit'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
