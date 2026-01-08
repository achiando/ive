
import { BottomNav } from "@/components/main/BottomNav";
import { Sidebar } from "@/components/main/Sidebar";
import { TopNav } from "@/components/main/TopNav";
import { authOptions } from "@/lib/auth";
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

    {/* Mobile Top Navigation */}
    <TopNav /> {/* Only visible on mobile due to internal styling */}

    <div className="flex-1 flex flex-col overflow-hidden sm:mt-28">
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 md:pt-0 pt-16 md:pb-0 pb-16 sm:mt-54 md:mt-4"> {/* Add padding-top and padding-bottom for mobile */}
        {children}
      </main>
    </div>

    {/* Mobile Bottom Navigation */}
    <BottomNav /> {/* Only visible on mobile due to internal styling */}
  </div>
  );
}
