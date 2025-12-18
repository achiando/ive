import { sendPasswordResetEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiting: 5 requests per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60, // 15 minutes
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // Apply rate limiting
    await rateLimiter.consume(ip);

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
      select: { id: true, email: true, firstName: true } // Only select needed fields
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, you will receive a password reset link' },
        { status: 200 }
      );
    }

    // Generate and hash reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await hash(resetToken, 12);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save hashed token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
      },
    });

    // Create reset URL with unhashed token
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send email with the unhashed token
    await sendPasswordResetEmail(
      user.email,
      user.firstName || 'User',
      resetUrl
    );

    return NextResponse.json({
      message: 'If an account with that email exists, you will receive a password reset link'
    });

  } catch (error: any) {
    if (error.remainingPoints === 0) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }
    
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}