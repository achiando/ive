
import { AssessmentChecker } from "@/components/AssessmentChecker";
import { Sidebar } from "@/components/main/Sidebar";
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
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
          <AssessmentChecker />
        </main>
      </div>
    </div>
  );
}
