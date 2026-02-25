"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { SafetyTestAttemptWithRelations } from "@/types/safety-test";
import { Search, Filter, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { columns } from "./columns";

interface AttemptsPageClientProps {
  attempts: SafetyTestAttemptWithRelations[];
}

export function AttemptsPageClient({ attempts }: AttemptsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedSafetyTest, setSelectedSafetyTest] = useState<string>("all");

  const isLoading = !attempts;

  useEffect(() => {
    const shouldReload = new URLSearchParams(window.location.search).get('reload') === 'true';
    if (shouldReload) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      window.location.reload();
    }
  }, []);

  // Get unique values for filters
  const uniqueUsers = useMemo(() => {
    const users = new Map();
    attempts?.forEach(attempt => {
      const key = attempt.user.id;
      if (!users.has(key)) {
        users.set(key, {
          id: key,
          name: `${attempt.user.firstName} ${attempt.user.lastName}`,
          email: attempt.user.email
        });
      }
    });
    return Array.from(users.values());
  }, [attempts]);

  const uniqueEquipment = useMemo(() => {
    const equipment = new Map();
    attempts?.forEach(attempt => {
      if (attempt.equipment) {
        const key = attempt.equipment.id;
        if (!equipment.has(key)) {
          equipment.set(key, {
            id: key,
            name: attempt.equipment.name,
            serialNumber: attempt.equipment.serialNumber
          });
        }
      }
    });
    return Array.from(equipment.values());
  }, [attempts]);

  const uniqueSafetyTests = useMemo(() => {
    const tests = new Map();
    attempts?.forEach(attempt => {
      if (attempt.safetyTest) {
        const key = attempt.safetyTest.id;
        if (!tests.has(key)) {
          tests.set(key, {
            id: key,
            name: attempt.safetyTest.name
          });
        }
      }
    });
    return Array.from(tests.values());
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    let currentAttempts = attempts;

    // Apply search term filter
    if (searchTerm) {
      currentAttempts = currentAttempts?.filter(
        (attempt) =>
          attempt.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attempt.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attempt.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attempt.safetyTest?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attempt.equipment?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply user filter
    if (selectedUser !== "all") {
      currentAttempts = currentAttempts?.filter((attempt) => attempt.user.id === selectedUser);
    }

    // Apply equipment filter
    if (selectedEquipment !== "all") {
      currentAttempts = currentAttempts?.filter((attempt) => 
        attempt.equipment?.id === selectedEquipment
      );
    }

    // Apply safety test filter
    if (selectedSafetyTest !== "all") {
      currentAttempts = currentAttempts?.filter((attempt) => 
        attempt.safetyTest?.id === selectedSafetyTest
      );
    }

    return currentAttempts;
  }, [attempts, searchTerm, selectedUser, selectedEquipment, selectedSafetyTest]);

  const handleExport = () => {
    // Basic CSV export functionality
    const headers = ['User', 'Email', 'Safety Test', 'Equipment', 'Completed At', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredAttempts?.map(attempt => [
        `${attempt.user.firstName} ${attempt.user.lastName}`,
        attempt.user.email,
        attempt.safetyTest?.name || 'General Test',
        attempt.equipment?.name || 'No Equipment',
        new Date(attempt.completedAt).toISOString(),
        new Date(attempt.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-test-attempts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Safety Test Attempts
          </h1>
          <p className="text-muted-foreground">
            View and manage safety test completion attempts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{attempts?.length || 0}</div>
          <p className="text-sm text-muted-foreground">Total Attempts</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{uniqueUsers.length}</div>
          <p className="text-sm text-muted-foreground">Unique Users</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{uniqueEquipment.length}</div>
          <p className="text-sm text-muted-foreground">Equipment Used</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{uniqueSafetyTests.length}</div>
          <p className="text-sm text-muted-foreground">Safety Tests</p>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredAttempts || []}
        filterColumnId="userName"
        filterColumnPlaceholder="Search attempts..."
      >
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attempts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>

        {/* User Filter */}
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Equipment Filter */}
        <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            {uniqueEquipment.map((equipment) => (
              <SelectItem key={equipment.id} value={equipment.id}>
                {equipment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Safety Test Filter */}
        <Select value={selectedSafetyTest} onValueChange={setSelectedSafetyTest}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            {uniqueSafetyTests.map((test) => (
              <SelectItem key={test.id} value={test.id}>
                {test.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTable>
    </div>
  );
}
