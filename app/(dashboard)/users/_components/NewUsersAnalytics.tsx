'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import { User } from '@prisma/client';

interface NewUsersAnalyticsProps {
  users: User[];
  isLoading: boolean;
  className?: string;
}

interface MonthlyData {
  month: string;
  year: number;
  count: number;
  monthName: string;
  displayName: string;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function NewUsersAnalytics({ users = [], isLoading, className }: NewUsersAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last3months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  // Generate monthly data from users
  const monthlyData = useMemo(() => {
    const data: Record<string, MonthlyData> = {};
    
    safeUsers.forEach(user => {
      const createdDate = new Date(user.createdAt);
      const year = createdDate.getFullYear();
      const month = createdDate.getMonth();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!data[monthKey]) {
        data[monthKey] = {
          month: month.toString().padStart(2, '0'),
          year,
          count: 0,
          monthName: monthNames[month],
          displayName: `${monthNames[month]} ${year}`
        };
      }
      data[monthKey].count++;
    });

    return Object.values(data).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return parseInt(b.month) - parseInt(a.month);
    });
  }, [safeUsers]);

  // Get available years and months
  const availableYears = useMemo(() => {
    const years = [...new Set(monthlyData.map(d => d.year))].sort((a, b) => b - a);
    return years;
  }, [monthlyData]);

  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];
    return monthlyData
      .filter(d => d.year === parseInt(selectedYear))
      .sort((a, b) => parseInt(b.month) - parseInt(a.month));
  }, [monthlyData, selectedYear]);

  // Get data to display based on selected period
  const displayData = useMemo(() => {
    if (selectedPeriod === 'custom' && selectedMonth && selectedYear) {
      const monthKey = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      const customData = monthlyData.find(d => `${d.year}-${d.month}` === monthKey);
      return customData ? [customData] : [];
    } else if (selectedPeriod === 'last3months') {
      // Get last 3 months including current month
      const now = new Date();
      const last3Months = [];
      
      for (let i = 0; i < 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        const existingData = monthlyData.find(d => `${d.year}-${d.month}` === monthKey);
        last3Months.push(existingData || {
          month: month.toString().padStart(2, '0'),
          year,
          count: 0,
          monthName: monthNames[month],
          displayName: `${monthNames[month]} ${year}`
        });
      }
      
      return last3Months;
    }
    return [];
  }, [selectedPeriod, selectedMonth, selectedYear, monthlyData]);

  // Calculate statistics
  const totalNewUsers = displayData.reduce((sum, data) => sum + data.count, 0);
  const averagePerMonth = displayData.length > 0 ? Math.round(totalNewUsers / displayData.length) : 0;
  const highestMonth = displayData.reduce((max, data) => data.count > max.count ? data : max, { count: 0, displayName: 'N/A' });

  // Calculate trend (comparing current month with previous month for last 3 months view)
  const trend = useMemo(() => {
    if (selectedPeriod === 'last3months' && displayData.length >= 2) {
      const current = displayData[0]?.count || 0;
      const previous = displayData[1]?.count || 0;
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }
    return 0;
  }, [displayData, selectedPeriod]);

  useEffect(() => {
    // Set default year to current year if available
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0].toString());
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    // Set default month to current month if available
    if (availableMonths.length > 0 && !selectedMonth && selectedYear) {
      const currentMonth = new Date().getMonth();
      const currentMonthData = availableMonths.find(m => parseInt(m.month) === currentMonth);
      if (currentMonthData) {
        setSelectedMonth(currentMonthData.month);
      } else {
        setSelectedMonth(availableMonths[0].month);
      }
    }
  }, [availableMonths, selectedMonth, selectedYear]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                New Users per Month
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track user registration trends and growth patterns
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Selector */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last3months">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map(month => (
                        <SelectItem key={`${month.year}-${month.month}`} value={month.month}>
                          {month.monthName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total New Users</p>
                    <p className="text-2xl font-bold text-blue-600">{totalNewUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average per Month</p>
                    <p className="text-2xl font-bold text-green-600">{averagePerMonth}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {selectedPeriod === 'last3months' ? 'Monthly Trend' : 'Peak Month'}
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedPeriod === 'last3months' 
                        ? `${trend >= 0 ? '+' : ''}${trend}%`
                        : highestMonth.count
                      }
                    </p>
                  </div>
                  <TrendingUp className={`h-8 w-8 ${
                    selectedPeriod === 'last3months' 
                      ? trend >= 0 ? 'text-green-500' : 'text-red-500'
                      : 'text-purple-500'
                  }`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <div>
            <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {selectedPeriod === 'last3months' ? 'Last 3 Months Breakdown' : 'Selected Month Details'}
            </h4>
            <div className="space-y-3">
              {displayData.map((data, index) => {
                const maxCount = Math.max(...displayData.map(d => d.count));
                const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                
                return (
                  <div key={`${data.year}-${data.month}`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-24">
                      <p className="text-sm font-medium">{data.displayName}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">New Users</span>
                        <span className="text-sm font-semibold">{data.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    {selectedPeriod === 'last3months' && index === 0 && (
                      <div className="flex-shrink-0">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Current
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {displayData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No user registration data available for the selected period.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
