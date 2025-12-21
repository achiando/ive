"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bulkCreateEquipment, BulkEquipmentInput } from "@/lib/actions/bulk-equipment"; // Import the server action
import { EquipmentStatus } from "@/types/equipment"; // Import EquipmentStatus enum
import { Download, UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { ChangeEvent, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FailedEquipmentItemRow } from "./FailedEquipmentItemRow"; // Import the new component

interface FailedItem {
  row: number;
  data: BulkEquipmentInput;
  errors: string[];
  isEditing: boolean; // Ensure this is always present
  editedData: BulkEquipmentInput; // Ensure this is always present
  selectedForReupload: boolean; // New field to track selection
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

  const processAndUpload = async (dataToUpload: BulkEquipmentInput[], isReupload = false) => {
    const currentLoadingState = isReupload ? setIsReuploading : setIsLoading;
    currentLoadingState(true);

    try {
      const result = await bulkCreateEquipment(dataToUpload);

      const newFailedItems: FailedItem[] = [];
      result.failedItems?.forEach(item => {
        const originalFailedItem = uploadResult?.failedItems?.find(fi => fi.data.serialNumber === item.data.serialNumber);
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
        : `Successfully uploaded ${result.successCount} equipment items.`;

      setUploadResult(prev => {
        const existingFailed = prev?.failedItems || [];
        const remainingFailed = existingFailed.filter(
          fi => !dataToUpload.some(d => d.serialNumber === fi.data.serialNumber) || newFailedItems.some(nfi => nfi.data.serialNumber === fi.data.serialNumber)
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

      const equipmentToUpload: BulkEquipmentInput[] = parsedData.map((item: any, index: number) => ({
        name: item.name,
        description: item.description,
        category: item.category,
        manufacturer: item.manufacturer,
        model: item.model,
        serialNumber: item.serialNumber,
        location: item.location,
        status: item.status as EquipmentStatus,
        dailyCapacity: parseInt(item.dailyCapacity) || 1,
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : undefined,
        purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : undefined,
        warrantyExpiry: item.warrantyExpiry ? new Date(item.warrantyExpiry).toISOString().split('T')[0] : undefined,
        estimatedPrice: item.estimatedPrice ? parseFloat(item.estimatedPrice) : undefined,
        actualPrice: item.actualPrice ? parseFloat(item.actualPrice) : undefined,
        notes: item.notes,
        requiresSafetyTest: item.requiresSafetyTest === "TRUE",
        imageUrl: item.imageUrl,
        manualUrl: item.manualUrl,
      }));

      await processAndUpload(equipmentToUpload);

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
      "name", "description", "category", "manufacturer", "model", "serialNumber",
      "location", "status", "dailyCapacity", "purchaseDate", "purchasePrice",
      "warrantyExpiry", "estimatedPrice", "actualPrice", "notes",
      "requiresSafetyTest", "imageUrl", "manualUrl"
    ];
    const validStatuses = Object.values(EquipmentStatus).join(', ');
    const sampleData = [
      {
        name: "Microscope X100",
        description: "High-resolution optical microscope",
        category: "Lab Equipment",
        manufacturer: "OptiTech",
        model: "MX100",
        serialNumber: "SN-MX100-001",
        location: "Lab 101",
        status: `AVAILABLE (Options: ${validStatuses})`,
        dailyCapacity: 1,
        purchaseDate: "2023-01-15",
        purchasePrice: 1500.00,
        warrantyExpiry: "2025-01-15",
        estimatedPrice: 1600.00,
        actualPrice: 1550.00,
        notes: "Used for advanced material analysis.",
        requiresSafetyTest: "TRUE",
        imageUrl: "https://example.com/microscope.jpg",
        manualUrl: "https://example.com/microscope_manual.pdf"
      },
      {
        name: "3D Printer Pro",
        description: "Industrial grade 3D printer",
        category: "Tools",
        manufacturer: "PrintWorks",
        model: "3DP-PRO",
        serialNumber: "SN-3DP-PRO-002",
        location: "Workshop",
        status: `IN_USE (Options: ${validStatuses})`,
        dailyCapacity: 1,
        purchaseDate: "2022-06-01",
        purchasePrice: 5000.00,
        warrantyExpiry: "2024-06-01",
        estimatedPrice: 5200.00,
        actualPrice: 5100.00,
        notes: "Requires regular maintenance.",
        requiresSafetyTest: "FALSE",
        imageUrl: "",
        manualUrl: ""
      }
    ];

    const csv = Papa.unparse(sampleData, { header: true, columns: headers });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'equipment_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditChange = useCallback((row: number, field: keyof BulkEquipmentInput, value: any) => {
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
        <CardTitle>Bulk Upload Equipment</CardTitle>
        <CardDescription>Upload a CSV or Excel file to add multiple equipment entries.</CardDescription>
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
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Daily Capacity</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Requires Safety Test</TableHead>
                        <TableHead className="w-[200px]">Errors</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResult.failedItems.map((item) => (
                        <FailedEquipmentItemRow
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
