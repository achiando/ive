import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    };
  }

  // This represents the user object from the database (with password)
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    // password: string;
  }
  
  // This represents the user object that will be available in the session
  interface DefaultSession {
    user?: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
