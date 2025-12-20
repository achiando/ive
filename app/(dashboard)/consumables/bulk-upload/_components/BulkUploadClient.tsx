"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BulkConsumableInput, bulkCreateConsumable } from "@/lib/actions/bulk-consumable"; // Import the server action
import { ConsumableCategory } from "@prisma/client";
import { Download, UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { ChangeEvent, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

interface UploadResult {
  fileName: string;
  status: 'success' | 'failure';
  message: string;
  failedItems?: { data: any; errors: string[] }[];
}

export function BulkUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleUpload = async () => {
    if (!file) {
      setUploadResult({ fileName: "N/A", status: "failure", message: "No file selected." });
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
        setUploadResult({ fileName: file.name, status: "failure", message: "Unsupported file type." });
        setIsLoading(false);
        return;
      }

      // Convert parsed data to BulkConsumableInput[]
      const consumablesToUpload: BulkConsumableInput[] = parsedData.map((item: any) => ({
        name: item.name,
        description: item.description,
        category: item.category as ConsumableCategory, // Ensure category is valid enum
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        currentStock: parseFloat(item.currentStock),
        minimumStock: parseFloat(item.minimumStock),
        unitCost: item.unitCost ? parseFloat(item.unitCost) : undefined,
        location: item.location,
        supplier: item.supplier,
        notes: item.notes,
        image: item.image,
      }));

      const result = await bulkCreateConsumable(consumablesToUpload);

      if (result.failureCount > 0) {
        setUploadResult({
          fileName: file.name,
          status: "failure",
          message: `Uploaded ${result.successCount} items, ${result.failureCount} failed.`,
          failedItems: result.failedItems,
        });
      } else {
        setUploadResult({
          fileName: file.name,
          status: "success",
          message: `Successfully uploaded ${result.successCount} consumable items.`,
        });
      }

    } catch (error: any) {
      console.error("File processing error:", error);
      setUploadResult({ fileName: file.name, status: "failure", message: `Error processing file: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const headers = [
      "name", "description", "category", "unit", "currentStock",
      "minimumStock", "unitCost", "location", "supplier", "notes", "image"
    ];
    const sampleData = [
      {
        name: "9V Battery",
        description: "Alkaline 9V battery for general use",
        category: "CONSUMABLE",
        unit: "pcs",
        currentStock: 100,
        minimumStock: 20,
        unitCost: 1.50,
        location: "Shelf B3",
        supplier: "Electronics Inc.",
        notes: "Good for multimeters and small circuits",
        image: "https://example.com/9v_battery.jpg"
      },
      {
        name: "Resistor Kit",
        description: "Assorted resistor values, 1/4W",
        category: "SPARE",
        unit: "kits",
        currentStock: 10,
        minimumStock: 2,
        unitCost: 15.00,
        location: "Drawer 5",
        supplier: "Component Co.",
        notes: "",
        image: ""
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
          <Button onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading ? "Uploading..." : "Upload File"}
          </Button>
        </div>

        {uploadResult && (
          <div className={`p-4 rounded-lg ${uploadResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h3 className="font-semibold">{uploadResult.status === 'success' ? 'Upload Successful' : 'Upload Failed'}</h3>
            <p>{uploadResult.message}</p>
            {uploadResult.failedItems && uploadResult.failedItems.length > 0 && (
              <div className="mt-4">
                <p className="font-medium">Failed Items:</p>
                <ul className="list-disc pl-5">
                  {uploadResult.failedItems.map((item, index) => (
                    <li key={index}>
                      Row {index + 1}: {JSON.stringify(item.data)} - Errors: {item.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
