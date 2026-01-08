
import Image from 'next/image';
import Link from 'next/link';
import { NewRegistrationForm } from './_components/NewRegistrationForm';

export default function RegisterPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-3 lg:px-0">
      {/* Left Branding Panel: 1/3 width */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex lg:col-span-1 dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex flex-1 flex-col items-center justify-center text-center">
          <Image 
            src="/logo.png" 
            alt="CDIE Design Logo" 
            width={80} 
            height={80} 
            className="h-20 w-20 object-contain mb-3" 
            priority
          />
          <span className="text-2xl font-bold tracking-tight mb-4">CDIE Design</span>
          <blockquote className="space-y-2">
            <p className="text-lg font-semibold">
              Welcome to CDIE Design!
            </p>
            <p className="text-base">
              Empowering creativity, innovation, and collaboration. Register now to access exclusive events, cutting-edge equipment, and a vibrant community.
            </p>
          </blockquote>
        </div>
      </div>
      {/* Registration Form: 2/3 width */}
      <div className="lg:col-span-2 flex flex-col justify-center lg:p-8">
  
            <NewRegistrationForm />
        <div className="mt-6 flex justify-center">
          <Link href="/" className="text-sm text-primary hover:underline">&larr; Back Home</Link>
        </div>
      </div>
    </div>
  );
}
