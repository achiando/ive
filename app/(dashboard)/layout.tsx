
import { BottomNav } from "@/components/main/BottomNav";
import { Sidebar } from "@/components/main/Sidebar";
import { TopNav } from "@/components/main/TopNav";
import { authOptions } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  return (
    <div className="flex h-screen w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex"> {/* Hide on mobile */}
        <Sidebar />
      </div>

      <TopNav /> {/* Only visible on mobile due to internal styling */}

      <div className="flex-1 flex flex-col overflow-hidden mt-4 md:mt-0">
        <main className={cn(
          "flex-1 overflow-y-auto p-4 lg:p-6 mt-4 md:mt-0",
          "pb-16 md:pb-0", // Bottom padding for mobile bottom nav
          "pt-16 md:pt-0"  // Top padding for mobile top nav
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav /> {/* Only visible on mobile due to internal styling */}
    </div>
  );
}
