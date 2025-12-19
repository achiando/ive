"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { getBookingAnalytics } from "@/lib/actions/booking"; // Import server action
import { BookingAnalyticsData, BookingStatus } from "@/types/booking";

// Tremor components
import { BarChart, DonutChart, LineChart, Legend } from "@tremor/react";

// PDF export libraries
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface BookingAnalyticsProps {
  initialData: BookingAnalyticsData;
}

export function BookingAnalytics({ initialData }: BookingAnalyticsProps) {
  const [reportData, setReportData] = useState<BookingAnalyticsData>(initialData);
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
      const data = await getBookingAnalytics(); // getBookingAnalytics already handles date range internally if needed
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch booking analytics data:", error);
      // Optionally set an error state to display to the user
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
      pdf.save("booking_analytics_report.pdf");
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
        <h1 className="text-3xl font-bold tracking-tight">Booking Analytics</h1>
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
            Summary of booking activities from {formattedDateRange}.
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
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalBookings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.averageBookingDuration} hrs</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.bookingsByStatus.find(s => s.status === BookingStatus.APPROVED)?.count || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.bookingsByStatus.find(s => s.status === BookingStatus.PENDING)?.count || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Bookings by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={reportData.bookingsByStatus.map(item => ({
                        name: item.status.replace(/_/g, ' '),
                        value: item.count
                      }))}
                      category="value"
                      index="name"
                      variant="pie"
                      valueFormatter={(number: number) => `${number}`}
                      className="h-40"
                    />
                    <Legend
                      categories={reportData.bookingsByStatus.map(item => item.status.replace(/_/g, ' '))}
                      className="mt-3"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Equipment Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={reportData.bookingsByEquipment.map(item => ({
                        name: item.equipmentName,
                        value: item.count
                      }))}
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
                    <CardTitle>Peak Booking Times (by hour)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={reportData.peakBookingTimes.map(item => ({
                        hour: `${item.hour}:00`,
                        bookings: item.count
                      }))}
                      index="hour"
                      categories={["bookings"]}
                      colors={["indigo"]}
                      yAxisWidth={48}
                      className="h-60"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Users by Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={reportData.bookingsByUser.map(item => ({
                        name: item.userName,
                        value: item.count
                      }))}
                      index="name"
                      categories={["value"]}
                      colors={["teal"]}
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
