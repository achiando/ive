import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { authenticated: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
  });
}
