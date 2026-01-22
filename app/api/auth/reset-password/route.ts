import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime for bcrypt


export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Find user by reset token and check if it's not expired
    const usersWithResetTokens = await prisma.user.findMany({
      where: {
        resetToken: {
          not: null,
        },
        resetExpiry: {
          gt: new Date(),
        },
      },
    });

    let user = null;
    for (const u of usersWithResetTokens) {
      if (u.resetToken && await compare(token, u.resetToken)) {
        user = u;
        break;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password using bcryptjs
    const hashedPassword = await hash(password, 10);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null,
      },
    });

    return NextResponse.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
