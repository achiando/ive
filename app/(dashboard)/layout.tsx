
import { Sidebar } from "@/components/main/Sidebar";
import { ReactNode } from "react";


export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
       <div className="flex h-screen bg-gray-50 overflow-hidden">
           <Sidebar />
           <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
             {children}
           </main>
       </div>
    );
}
