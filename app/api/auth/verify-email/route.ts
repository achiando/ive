import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

const ADMIN_APPROVAL_EMAIL = 'awinja.stacy+CDIE@ku.ac.ke';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      );
    }

    const isTokenValid = user.verificationToken === token;
    const isTokenExpired = user.verificationExpiry
      ? new Date() > new Date(user.verificationExpiry)
      : true;

    if (!isTokenValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (isTokenExpired) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Token is valid and not expired, update the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null, // Clear the token
        verificationExpiry: null, // Clear the expiry
      },
    });

    // Send admin notification about email verification
    await sendEmail({
      to: ADMIN_APPROVAL_EMAIL,
      subject: `Email Verified: ${user.firstName} ${user.lastName}`,
      html: `
        <h2>User Email Verification Complete</h2>
        <p>A user has successfully verified their email address:</p>
        <ul>
          <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Role:</strong> ${user.role}</li>
          <li><strong>Status:</strong> ${user.status}</li>
          ${user.studentId ? `<li><strong>Student ID:</strong> ${user.studentId}</li>` : ''}
          ${user.program ? `<li><strong>Program:</strong> ${user.program}</li>` : ''}
          ${user.affiliatedInstitution ? `<li><strong>Affiliated Institution:</strong> ${user.affiliatedInstitution}</li>` : ''}
          <li><strong>Verification Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>The user has verified their email and is now ready for account approval.</p>
        <p>Please review and approve this registration in the admin dashboard.</p>
      `
    });

    return NextResponse.json(
      { message: 'Email verified successfully. You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
