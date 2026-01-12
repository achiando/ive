import { sendVerificationCodeEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return NextResponse.json(
        { message: 'If an account with that email exists, a new code has been sent.' },
        { status: 200 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'This email has already been verified.' },
        { status: 400 }
      );
    }

    // Generate a new token and expiry
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update user with the new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpiry,
      },
    });

    // Resend the verification email
    await sendVerificationCodeEmail(user.email, `${user.firstName} ${user.lastName}`, verificationToken);

    return NextResponse.json(
      { message: 'A new verification code has been sent to your email.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resending the verification code' },
      { status: 500 }
    );
  }
}
