import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const email = searchParams.get('email');

    if (!studentId && !email) {
      return NextResponse.json(
        { error: 'Either studentId or email must be provided' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(studentId ? [{ studentId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      select: {
        id: true,
        email: true,
        studentId: true,
      },
    });

    return NextResponse.json({
      exists: !!existingUser,
      ...(existingUser?.email === email && { emailExists: true }),
      ...(existingUser?.studentId === studentId && { studentIdExists: true })
    });

  } catch (error) {
    console.error('Error checking credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
