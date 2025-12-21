"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BulkConsumableInput, bulkCreateConsumable } from "@/lib/actions/bulk-consumable"; // Import the server action
import { ConsumableCategory, ConsumableStatus } from "@prisma/client";
import { Download, UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { ChangeEvent, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FailedConsumableItemRow } from "./FailedConsumableItemRow";

interface FailedItem {
  row: number;
  data: BulkConsumableInput;
  errors: string[];
  isEditing: boolean;
  editedData: BulkConsumableInput;
  selectedForReupload: boolean;
}

interface UploadResult {
  fileName: string;
  status: 'success' | 'partial' | 'failure';
  message: string;
  successCount: number;
  failureCount: number;
  failedItems?: FailedItem[];
}

export function BulkUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReuploading, setIsReuploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadResult(null); // Reset result on new file selection
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setUploadResult(null);
    }
  };

  const processAndUpload = async (dataToUpload: BulkConsumableInput[], isReupload = false) => {
    const currentLoadingState = isReupload ? setIsReuploading : setIsLoading;
    currentLoadingState(true);

    try {
      const result = await bulkCreateConsumable(dataToUpload);

      const newFailedItems: FailedItem[] = [];
      result.failedItems?.forEach(item => {
        const originalFailedItem = uploadResult?.failedItems?.find(fi => fi.data.name === item.data.name && fi.data.category === item.data.category); // Using name and category for uniqueness
        newFailedItems.push({
          row: originalFailedItem?.row || 0, // Preserve original row number if re-uploading
          data: item.data,
          errors: item.errors,
          isEditing: false,
          editedData: { ...item.data },
          selectedForReupload: false,
        });
      });

      const status = result.successCount > 0 ? (newFailedItems.length > 0 ? 'partial' : 'success') : 'failure';
      const message = newFailedItems.length > 0
        ? `Uploaded ${result.successCount} items, ${newFailedItems.length} failed.`
        : `Successfully uploaded ${result.successCount} consumable items.`;

      setUploadResult(prev => {
        const existingFailed = prev?.failedItems || [];
        const remainingFailed = existingFailed.filter(
          fi => !dataToUpload.some(d => d.name === fi.data.name && d.category === fi.data.category) || newFailedItems.some(nfi => nfi.data.name === fi.data.name && nfi.data.category === fi.data.category)
        );

        return {
          fileName: prev?.fileName || file?.name || "N/A",
          status,
          message,
          successCount: (prev?.successCount || 0) + result.successCount,
          failureCount: newFailedItems.length,
          failedItems: newFailedItems.length > 0 ? newFailedItems : undefined,
        };
      });

      if (result.successCount > 0) {
        toast.success(`${result.successCount} items uploaded successfully.`);
      }
      if (newFailedItems.length > 0) {
        toast.error(`${newFailedItems.length} items failed to upload.`);
      }

    } catch (error: any) {
      console.error("Upload/Re-upload error:", error);
      toast.error(`Error during ${isReupload ? 're-upload' : 'upload'}: ${error.message}`);
      setUploadResult(prev => ({
        fileName: prev?.fileName || file?.name || "N/A",
        status: "failure",
        message: `Error during ${isReupload ? 're-upload' : 'upload'}: ${error.message}`,
        successCount: prev?.successCount || 0,
        failureCount: prev?.failureCount || 0,
        failedItems: prev?.failedItems,
      }));
    } finally {
      currentLoadingState(false);
    }
  };

  const handleUploadInitialFile = async () => {
    if (!file) {
      setUploadResult({
        fileName: "N/A",
        status: "failure",
        message: "No file selected.",
        successCount: 0,
        failureCount: 0
      });
      return;
    }

    setIsLoading(true);
    setUploadResult(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let parsedData: any[] = [];

      if (fileExtension === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        parsedData = result.data;
      } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        setUploadResult({
          fileName: file.name,
          status: "failure",
          message: "Unsupported file type.",
          successCount: 0,
          failureCount: 0
        });
        setIsLoading(false);
        return;
      }

      const consumablesToUpload: BulkConsumableInput[] = parsedData.map((item: any) => ({
        name: item.name,
        description: item.description,
        category: item.category as ConsumableCategory,
        unit: item.unit,
        quantity: parseInt(item.quantity), // Changed to parseInt as per Prisma schema
        currentStock: parseFloat(item.currentStock),
        minimumStock: parseFloat(item.minimumStock),
        unitCost: item.unitCost ? parseFloat(item.unitCost) : undefined,
        location: item.location,
        supplier: item.supplier,
        notes: item.notes,
        image: item.image,
        status: item.status as ConsumableStatus, // Added status
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined, // Added expiryDate
      }));

      await processAndUpload(consumablesToUpload);

    } catch (error: any) {
      console.error("File processing error:", error);
      setUploadResult({
        fileName: file.name,
        status: "failure",
        message: `Error processing file: ${error.message}`,
        successCount: 0,
        failureCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const headers = [
      "name", "description", "category", "unit", "quantity", "currentStock",
      "minimumStock", "unitCost", "location", "supplier", "notes", "image",
      "status", "expiryDate"
    ];
    const validCategories = Object.values(ConsumableCategory).join(', ');
    const validStatuses = Object.values(ConsumableStatus).join(', '); // Assuming ConsumableStatus is imported
    const sampleData = [
      {
        name: "9V Battery",
        description: "Alkaline 9V battery for general use",
        category: `CONSUMABLE (Options: ${validCategories})`,
        unit: "pcs",
        quantity: 100,
        currentStock: 90,
        minimumStock: 20,
        unitCost: 1.50,
        location: "Shelf B3",
        supplier: "Electronics Inc.",
        notes: "Good for multimeters and small circuits",
        image: "https://example.com/9v_battery.jpg",
        status: `AVAILABLE (Options: ${validStatuses})`,
        expiryDate: "2026-12-31"
      },
      {
        name: "Resistor Kit",
        description: "Assorted resistor values, 1/4W",
        category: `SPARE (Options: ${validCategories})`,
        unit: "kits",
        quantity: 10,
        currentStock: 8,
        minimumStock: 2,
        unitCost: 15.00,
        location: "Drawer 5",
        supplier: "Component Co.",
        notes: "Used for various circuit prototypes",
        image: "",
        status: `AVAILABLE (Options: ${validStatuses})`,
        expiryDate: ""
      },
      {
        name: "Solder Wire",
        description: "Lead-free solder wire, 0.8mm",
        category: `CONSUMABLE (Options: ${validCategories})`,
        unit: "rolls",
        quantity: 50,
        currentStock: 45,
        minimumStock: 10,
        unitCost: 8.00,
        location: "Tool Cabinet",
        supplier: "Solder Supplies",
        notes: "Essential for electronics repair",
        image: "https://example.com/solder_wire.jpg",
        status: `LOW_STOCK (Options: ${validStatuses})`,
        expiryDate: "2027-06-30"
      },
      {
        name: "Multimeter Probes",
        description: "Replacement probes for digital multimeters",
        category: `SPARE (Options: ${validCategories})`,
        unit: "pairs",
        quantity: 5,
        currentStock: 3,
        minimumStock: 1,
        unitCost: 12.50,
        location: "Drawer 2",
        supplier: "Test Equipment Co.",
        notes: "Compatible with most standard multimeters",
        image: "",
        status: `AVAILABLE (Options: ${validStatuses})`,
        expiryDate: ""
      }
    ];

    const csv = Papa.unparse(sampleData, { header: true, columns: headers });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'consumable_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditChange = useCallback((row: number, field: keyof BulkConsumableInput, value: any) => {
    setUploadResult(prev => {
      if (!prev || !prev.failedItems) return prev;
      const updatedFailedItems = prev.failedItems.map(item => {
        if (item.row === row) {
          return {
            ...item,
            editedData: {
              ...item.editedData,
              [field]: value,
            },
          };
        }
        return item;
      });
      return { ...prev, failedItems: updatedFailedItems };
    });
  }, []);

  const handleToggleEdit = useCallback((row: number) => {
    setUploadResult(prev => {
      if (!prev || !prev.failedItems) return prev;
      const updatedFailedItems = prev.failedItems.map(item => {
        if (item.row === row) {
          return { ...item, isEditing: !item.isEditing };
        }
        return item;
      });
      return { ...prev, failedItems: updatedFailedItems };
    });
  }, []);

  const handleToggleSelect = useCallback((row: number, isSelected: boolean) => {
    setUploadResult(prev => {
      if (!prev || !prev.failedItems) return prev;
      const updatedFailedItems = prev.failedItems.map(item => {
        if (item.row === row) {
          return { ...item, selectedForReupload: isSelected };
        }
        return item;
      });
      return { ...prev, failedItems: updatedFailedItems };
    });
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean) => {
    setUploadResult(prev => {
      if (!prev || !prev.failedItems) return prev;
      const updatedFailedItems = prev.failedItems.map(item => ({
        ...item,
        selectedForReupload: isSelected,
      }));
      return { ...prev, failedItems: updatedFailedItems };
    });
  }, []);

  const handleReuploadSelected = async () => {
    if (!uploadResult?.failedItems) return;

    const selectedItems = uploadResult.failedItems.filter(item => item.selectedForReupload);
    if (selectedItems.length === 0) {
      toast.info("No items selected for re-upload.");
      return;
    }

    const dataToReupload = selectedItems.map(item => item.editedData);
    await processAndUpload(dataToReupload, true);
  };

  const allFailedItemsSelected = uploadResult?.failedItems?.every(item => item.selectedForReupload) ?? false;
  const someFailedItemsSelected = uploadResult?.failedItems?.some(item => item.selectedForReupload) ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Upload Consumables</CardTitle>
        <CardDescription>Upload a CSV or Excel file to add multiple consumable entries.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
        >
          <Input {...getInputProps()} />
          <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-muted-foreground">Drop the files here ...</p>
          ) : (
            <p className="text-muted-foreground">Drag 'n' drop your file here, or click to select file</p>
          )}
          {file && <p className="mt-2 text-sm font-medium">Selected file: {file.name}</p>}
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleDownloadSample}>
            <Download className="mr-2 h-4 w-4" />
            Download Sample CSV
          </Button>
          <Button onClick={handleUploadInitialFile} disabled={!file || isLoading}>
            {isLoading ? "Uploading..." : "Upload File"}
          </Button>
        </div>

        {uploadResult && (
          <div className={`p-4 rounded-lg ${uploadResult.status === 'success' ? 'bg-green-100 text-green-800' : uploadResult.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
            <h3 className="font-semibold">{uploadResult.status === 'success' ? 'Upload Successful' : uploadResult.status === 'partial' ? 'Partial Upload Success' : 'Upload Failed'}</h3>
            <p>{uploadResult.message}</p>

            {uploadResult.failedItems && uploadResult.failedItems.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Failed Items:</p>
                  <Button
                    onClick={handleReuploadSelected}
                    disabled={isReuploading || !uploadResult.failedItems.some(item => item.selectedForReupload)}
                    size="sm"
                  >
                    {isReuploading ? "Re-uploading..." : "Re-upload Selected"}
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              allFailedItemsSelected
                                ? true
                                : someFailedItemsSelected && !allFailedItemsSelected
                                ? 'indeterminate'
                                : false
                            }
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          />
                        </TableHead>
                        <TableHead className="w-[50px]">Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Minimum Stock</TableHead>
                        <TableHead className="w-[200px]">Errors</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResult.failedItems.map((item) => (
                        <FailedConsumableItemRow
                          key={item.row}
                          item={item}
                          onEditChange={handleEditChange}
                          onToggleEdit={handleToggleEdit}
                          onToggleSelect={handleToggleSelect}
                          isSelected={item.selectedForReupload}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
