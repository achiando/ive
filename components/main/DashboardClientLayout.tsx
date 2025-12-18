
"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardClientLayoutProps {
  children: ReactNode;
}

export default function DashboardClientLayout({ children }: DashboardClientLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
