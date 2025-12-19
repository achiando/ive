"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker"; // Assuming this component exists
import { DateRange } from "react-day-picker"; // Assuming this type exists
import { format } from "date-fns";
import { getMaintenanceReportData } from "@/lib/actions/maintenance-report"; // Import server action

// Tremor components (already installed)
import { BarChart, DonutChart, LineChart, Legend } from "@tremor/react";

// PDF export libraries (already installed)
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface MaintenanceReportData {
  totalMaintenances: number;
  maintenanceByStatus: { name: string; value: number }[];
  maintenanceByType: { name: string; value: number }[];
  maintenanceByEquipment: { name: string; value: number }[];
  maintenanceTrends: { date: string; maintenances: number }[];
  averageMaintenanceDuration: string;
  mostFrequentEquipmentForMaintenance: { name: string; count: number }[];
}

export function MaintenanceReportClient() {
  const [reportData, setReportData] = useState<MaintenanceReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]); // Refetch when date range changes

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const data = await getMaintenanceReportData(dateRange?.from, dateRange?.to);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch maintenance report data:", error);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsLoading(true);
    try {
      const input = reportRef.current;
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("maintenance_report.pdf");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDateRange = dateRange?.from
    ? `${format(dateRange.from, "LLL dd, y")} - ${dateRange.to ? format(dateRange.to, "LLL dd, y") : "Present"}`
    : "All Time";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Report</h1>
        <div className="flex items-center space-x-2">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button onClick={handleExportPdf} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Overview</CardTitle>
          <CardDescription>
            Summary of maintenance activities from {formattedDateRange}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading report data...</div>
          ) : reportData ? (
            <div ref={reportRef} className="space-y-8 p-4">
              {/* General Statistics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Maintenances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalMaintenances}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.averageMaintenanceDuration}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.maintenanceByStatus.find(s => s.name === 'COMPLETED')?.value || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.maintenanceByStatus.find(s => s.name === 'PENDING')?.value || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={reportData.maintenanceByStatus}
                      category="value"
                      index="name"
                      variant="pie"
                      valueFormatter={(number: number) => `${number}`}
                      className="h-40"
                    />
                    <Legend
                      categories={reportData.maintenanceByStatus.map(d => d.name)}
                      className="mt-3"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={reportData.maintenanceByType}
                      index="name"
                      categories={["value"]}
                      colors={["blue"]}
                      yAxisWidth={48}
                      className="h-40"
                    />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Maintenance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={reportData.maintenanceTrends}
                      index="date"
                      categories={["maintenances"]}
                      colors={["indigo"]}
                      yAxisWidth={48}
                      className="h-60"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance by Equipment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={reportData.maintenanceByEquipment}
                      index="name"
                      categories={["value"]}
                      colors={["teal"]}
                      yAxisWidth={48}
                      className="h-40"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Most Frequent Equipment for Maintenance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={reportData.mostFrequentEquipmentForMaintenance}
                      index="name"
                      categories={["count"]}
                      colors={["purple"]}
                      yAxisWidth={48}
                      className="h-40"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">No report data available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
