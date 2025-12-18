
import DashboardClientLayout from "@/components/main/DashboardClientLayout";
import { ReactNode } from "react";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <DashboardClientLayout>
            {children}
        </DashboardClientLayout>
    );
}
