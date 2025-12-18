import { sendRegistrationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { RegistrationStatus, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';



const ALLOWED_ROLES = [
  UserRole.STUDENT,
  UserRole.LECTURER,
  UserRole.FACULTY,
  UserRole.TECHNICIAN,
  UserRole.OTHER,
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      studentId,
      yearOfStudy,
      program,
      phoneNumber,
      affiliatedInstitution,
      associatedInstructor,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        status: RegistrationStatus.PENDING,
        ...(studentId && { studentId }),
        ...(yearOfStudy && { yearOfStudy: parseInt(yearOfStudy) }),
        ...(program && { program }),
        ...(phoneNumber && { phoneNumber }),
        ...(affiliatedInstitution && { affiliatedInstitution }),
        ...(associatedInstructor && { associatedInstructor }),
      },
    });

    // Send registration email (don't await to speed up response)
    sendRegistrationEmail(email, `${firstName} ${lastName}`).catch(console.error);

    // Return success response without sensitive data
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(
      { user: userWithoutPassword, message: 'Registration successful. Please wait for approval.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
