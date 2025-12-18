"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker"; // Assuming this component exists
import { DateRange } from "react-day-picker"; // Assuming this type exists
import { format } from "date-fns";
import { getEquipmentReportData } from "@/lib/actions/equipment-report"; // Import server action

// Tremor components (will need to install @tremor/react)
import { BarChart, DonutChart, LineChart, Legend } from "@tremor/react";

// PDF export libraries (will need to install jspdf and html2canvas)
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface EquipmentReportData {
  totalEquipment: number;
  equipmentByStatus: { name: string; value: number }[];
  equipmentByCategory: { name: string; value: number }[];
  totalBookings: number;
  averageBookingDuration: string; // e.g., "2.5 hours"
  mostBookedEquipment: { name: string; bookings: number }[];
  bookingTrends: { date: string; bookings: number }[];
  totalMaintenance: number;
  maintenanceByStatus: { name: string; value: number }[];
  maintenanceByType: { name: string; value: number }[];
}

export function EquipmentReportClient() {
  const [reportData, setReportData] = useState<EquipmentReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      const data = await getEquipmentReportData(dateRange?.from, dateRange?.to);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
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
      pdf.save("equipment_report.pdf");
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
        <h1 className="text-3xl font-bold tracking-tight">Equipment Usage Report</h1>
        <div className="flex items-center space-x-2">
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
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
            Summary of equipment usage and maintenance from {formattedDateRange}.
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
                    <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalEquipment}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalBookings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Booking Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.averageBookingDuration}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Maintenance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalMaintenance}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Equipment by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={reportData.equipmentByStatus}
                      category="value"
                      index="name"
                      variant="pie"
                      valueFormatter={(number: number) => `${number}`}
                      className="h-40"
                    />
                    <Legend
                      categories={reportData.equipmentByStatus.map(d => d.name)}
                      className="mt-3"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Equipment by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={reportData.equipmentByCategory}
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
                    <CardTitle>Booking Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={reportData.bookingTrends}
                      index="date"
                      categories={["bookings"]}
                      colors={["indigo"]}
                      yAxisWidth={48}
                      className="h-60"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Most Booked Equipment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={reportData.mostBookedEquipment}
                      index="name"
                      categories={["bookings"]}
                      colors={["teal"]}
                      yAxisWidth={48}
                      className="h-40"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={reportData.maintenanceByType}
                      category="value"
                      index="name"
                      variant="pie"
                      valueFormatter={(number: number) => `${number}`}
                      className="h-40"
                    />
                    <Legend
                      categories={reportData.maintenanceByType.map(d => d.name)}
                      className="mt-3"
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
