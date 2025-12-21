"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { BulkEquipmentInput } from "@/lib/actions/bulk-equipment";
import { EquipmentStatus } from "@/types/equipment";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface FailedItem {
  row: number;
  data: BulkEquipmentInput;
  errors: string[];
  isEditing?: boolean;
  editedData?: BulkEquipmentInput;
}

interface FailedEquipmentItemRowProps {
  item: FailedItem;
  onEditChange: (row: number, field: keyof BulkEquipmentInput, value: any) => void;
  onToggleEdit: (row: number) => void;
  onToggleSelect: (row: number, isSelected: boolean) => void;
  isSelected: boolean;
}

export function FailedEquipmentItemRow({
  item,
  onEditChange,
  onToggleEdit,
  onToggleSelect,
  isSelected,
}: FailedEquipmentItemRowProps) {
  const [currentEditedData, setCurrentEditedData] = useState<BulkEquipmentInput>(item.editedData || item.data);

  const handleFieldChange = (field: keyof BulkEquipmentInput, value: any) => {
    const updatedData = { ...currentEditedData, [field]: value };
    setCurrentEditedData(updatedData);
    onEditChange(item.row, field, value);
  };

  const categories = [
    'Electronics', 'Mechanical', 'Furniture', 'Tools', 'IT Equipment', 'Lab Equipment', 'Other'
  ];

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
            onValueChange={(value) => handleFieldChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
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
            value={currentEditedData.serialNumber || ''}
            onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
          />
        ) : (
          item.data.serialNumber
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Select
            value={currentEditedData.status}
            onValueChange={(value: EquipmentStatus) => handleFieldChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(EquipmentStatus).map((status) => (
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
            type="number"
            value={currentEditedData.dailyCapacity}
            onChange={(e) => handleFieldChange('dailyCapacity', parseInt(e.target.value) || 1)}
          />
        ) : (
          item.data.dailyCapacity
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            type="date"
            value={currentEditedData.purchaseDate ? new Date(currentEditedData.purchaseDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange('purchaseDate', e.target.value ? new Date(e.target.value) : undefined)}
          />
        ) : (
          item.data.purchaseDate ? new Date(item.data.purchaseDate).toLocaleDateString() : 'N/A'
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Input
            type="number"
            value={currentEditedData.purchasePrice || ''}
            onChange={(e) => handleFieldChange('purchasePrice', parseFloat(e.target.value) || undefined)}
          />
        ) : (
          item.data.purchasePrice || 'N/A'
        )}
      </TableCell>
      <TableCell>
        {item.isEditing ? (
          <Switch
            checked={currentEditedData.requiresSafetyTest}
            onCheckedChange={(checked) => handleFieldChange('requiresSafetyTest', checked)}
          />
        ) : (
          item.data.requiresSafetyTest ? 'Yes' : 'No'
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
