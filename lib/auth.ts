import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";



export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true  // Make sure to explicitly select status
          }
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isCorrectPassword = await compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.status
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status; // Add status to token
        
      }
      return token;
    },

    async session({ session, token }) {

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status; // Add status to session.user
       
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  // In your auth.ts file, update the JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    // encryption: true,
    // signingKey: '{"kty":"oct","kid":"--","alg":"HS256","k":"--"}',
    // encryptionKey: '{"kty":"oct","kid":"--","alg":"A128CBC-HS256","k":"--"}',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
