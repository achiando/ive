import { UserRole } from '@prisma/client';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  studentId?: string;
  yearOfStudy?: string | number;
  program?: string;
  phoneNumber?: string;
  affiliatedInstitution?: string;
  associatedInstructor?: string;
}

export interface RegisterResponse {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: string;
    studentId?: string;
    yearOfStudy?: number;
    program?: string;
    phoneNumber?: string;
    affiliatedInstitution?: string;
    associatedInstructor?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  message: string;
  error?: string;
}
