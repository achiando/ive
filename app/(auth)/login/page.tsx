
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Logo and Branding */}
      <div className="mb-6 text-center">
        <Image 
          src="/logo.png" 
          alt="CDIE Design Logo" 
          width={60} 
          height={60} 
          className="h-15 w-15 object-contain mx-auto mb-2" 
          priority
        />
        <span className="text-xl font-bold tracking-tight text-gray-900">CDIE Design</span>
      </div>
      
      {/* Login Form */}
      <LoginForm />
      
      {/* Back Home Link */}
      <div className="mt-4">
        <Link href="/" className="text-sm text-gray-600 hover:text-primary hover:underline">
          ← Back Home
        </Link>
      </div>
    </div>
  );
}
