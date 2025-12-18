
import { Sidebar } from "@/components/main/Sidebar";
import { ReactNode } from "react";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
