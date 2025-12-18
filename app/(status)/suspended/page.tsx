import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import Link from "next/link";

export default async function SuspendedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        <Ban className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Account Suspended
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Your account has been temporarily suspended.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Please contact our support team for more information on the reason for suspension and how to restore your account.
        </p>
        <div className="mt-8">
          <Button asChild>
            <a href="mailto:ive@ku.ac.ke">Contact Support</a>
          </Button>
           <p className="mt-4">
            <Link href="/auth/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
