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
          console.log("❌ Missing credentials");
          return null;
        }
      
        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password.trim();
      
        const user = await prisma.user.findUnique({
          where: { email },
        });
      
        if (!user || !user.password) {
          console.log("❌ User not found or missing password");
          return null;
        }
      
        const passwordMatch = await bcrypt.compare(password, user.password);
      
        if (!passwordMatch) {
          console.log("❌ Password mismatch");
          return null;
        }
      
        console.log("✅ Login success for", user.email);
      
        return {
          id: user.id,          // MUST be string
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export { getServerSession };