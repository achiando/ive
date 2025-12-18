"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { ExportPdfButton } from "@/components/analytics/export-pdf-button"; // Assuming this component exists
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Box, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { ConsumableCategory } from "@prisma/client";
import { useEffect, useState } from "react";
import { getConsumableAnalyticsData } from "@/lib/actions/consumable-analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface ConsumableAnalyticsData {
  totalItems: number;
  totalStock: number;
  totalValue: number;
  statusCounts: {
    IN_STOCK: number;
    LOW_STOCK: number;
    OUT_OF_STOCK: number;
  };
  categoryCounts: Record<ConsumableCategory, number>;
  monthlyConsumption: Record<string, number>;
  consumablesList: Array<{
    id: string;
    name: string;
    category: ConsumableCategory;
    currentStock: number;
    minimumStock: number;
    unit: string;
    unitCost: number | null;
    totalAllocated: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF0000'];

export function ConsumableAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<ConsumableAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getConsumableAnalyticsData();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Failed to fetch consumable analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto p-6 text-center text-muted-foreground">
        No analytics data available.
      </div>
    );
  }

  const statusChartData = [
    { name: 'In Stock', value: analyticsData.statusCounts.IN_STOCK, color: '#00C49F' },
    { name: 'Low Stock', value: analyticsData.statusCounts.LOW_STOCK, color: '#FFBB28' },
    { name: 'Out of Stock', value: analyticsData.statusCounts.OUT_OF_STOCK, color: '#FF8042' },
  ];

  const categoryChartData = Object.entries(analyticsData.categoryCounts).map(([name, value]) => ({
    name: name === ConsumableCategory.CONSUMABLE ? 'Consumables' : 'Spares',
    value,
  }));

  const monthlyConsumptionChartData = Object.entries(analyticsData.monthlyConsumption)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([name, value]) => ({ name, value }));

  return (
    <div id="analytics-content" className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Consumable Analytics Overview</h1>
        {/* <ExportPdfButton /> */}
      </div>
      <Separator />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumables</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalStock.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Status Overview</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.statusCounts.OUT_OF_STOCK} Out of Stock</div>
            <p className="text-xs text-muted-foreground">{analyticsData.statusCounts.LOW_STOCK} Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Consumables by Stock Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consumables by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Consumable Consumption</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyConsumptionChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Consumables List */}
      <Card>
        <CardHeader>
          <CardTitle>Consumables Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Allocated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.consumablesList.map((consumable) => (
                  <tr key={consumable.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{consumable.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{consumable.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{consumable.currentStock} {consumable.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{consumable.minimumStock} {consumable.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{consumable.unitCost ? `$${consumable.unitCost.toFixed(2)}` : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{consumable.totalAllocated} {consumable.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
