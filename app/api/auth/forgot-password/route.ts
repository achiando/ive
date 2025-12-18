import { sendPasswordResetEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime for crypto module



export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user doesn't exist for security reasons
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, you will receive a password reset link' },
        { status: 200 }
      );
    }

    // Generate reset token and expiry (1 hour from now)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save the reset token to the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email
    await sendPasswordResetEmail(
      user.email,
      user.firstName || 'User',
      resetUrl
    );

    return NextResponse.json({
      message: 'If an account with that email exists, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
