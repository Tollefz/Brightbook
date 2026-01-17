import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // If user doesn't exist or has no password, return null
        if (!user?.password) {
          return null;
        }

        // Compare provided password with stored hash using bcryptjs
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return null;
        }

        // Password matches, return user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

export const { handlers: authHandlers } = NextAuth(authOptions);

export const getAuthSession = () => getServerSession(authOptions);

