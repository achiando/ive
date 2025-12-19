import { getCurrentUser } from '@/lib/actions/user';
import { redirect } from 'next/navigation';
import { ProfileForm } from '../_components/ProfileForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login'); // Redirect to login if no user session
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/me">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Your Information</CardTitle>
          <CardDescription>
            Manage your personal details, contact information, and academic/professional data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={user} />
        </CardContent>
      </Card>
    </div>
  );
}
