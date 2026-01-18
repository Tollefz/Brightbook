import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import type { UserRole } from "@prisma/client";

// Get GitHub env vars
const githubId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
const githubSecret = process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

// Safe mode: Log env status but don't fail hard
// This allows the app to render even if auth is not fully configured
function logAuthEnvStatus() {
  if (typeof window === "undefined") {
    const missing = [];
    if (!githubId) missing.push("GITHUB_ID/GITHUB_CLIENT_ID");
    if (!githubSecret) missing.push("GITHUB_SECRET/GITHUB_CLIENT_SECRET");
    if (!nextAuthUrl) missing.push("NEXTAUTH_URL");
    if (!nextAuthSecret) missing.push("NEXTAUTH_SECRET");

    if (missing.length > 0) {
      console.warn(
        `[AUTH] Missing env variables: ${missing.join(", ")}. Auth features will be limited.`
      );
    } else {
      console.log("[AUTH] All required env variables are set.");
    }
  }
}

// Log on module load (only in server context)
if (typeof window === "undefined") {
  logAuthEnvStatus();
}

// Export validation function (non-throwing, just logs)
export function validateAuthConfig() {
  logAuthEnvStatus();
  // Don't throw - allow graceful degradation
  if (!githubId || !githubSecret) {
    console.warn("[AUTH] GitHub provider not configured. Admin login will not work.");
    return false;
  }
  return true;
}

// Build providers array - only add GitHub if credentials are available
// This prevents NextAuth from failing if env vars are missing
const providers = [];
if (githubId && githubSecret) {
  providers.push(
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
    })
  );
} else {
  // If no providers, NextAuth will still work but won't have any auth methods
  // This allows the app to render without crashing
  console.warn("[AUTH] No providers configured. Admin features disabled.");
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt", // Use JWT strategy (works with existing User model)
  },
  providers,
  secret: nextAuthSecret,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in if GitHub provider
      if (account?.provider === "github") {
        const email = user.email || (profile as any)?.email;
        if (!email) {
          console.warn("[AUTH] No email from GitHub profile");
          return false;
        }

        try {
          // Check if user exists in DB
          const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (existingUser) {
            // User exists - check if they should be admin
            if (isAdminEmail(email) && existingUser.role !== "admin") {
              // Auto-promote to admin if email is in allowlist
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { role: "admin" },
              });
              console.log(`[AUTH] Auto-promoted ${email} to admin`);
            }
            // If user exists but not admin, role stays as is (no auto-promote)
          } else {
            // New user - create in DB
            const role: UserRole = isAdminEmail(email) ? "admin" : "support";
            // Generate a random password for OAuth users (they won't use it)
            const randomPassword = `oauth_${Math.random().toString(36).slice(2)}`;
            await prisma.user.create({
              data: {
                email: email.toLowerCase(),
                name: user.name || (profile as any)?.name || null,
                password: randomPassword, // Random password for OAuth users (not used)
                role,
              },
            });
            console.log(`[AUTH] Created new user ${email} with role ${role}`);
          }
        } catch (error) {
          console.error("[AUTH] Error in signIn callback:", error);
          // Don't block sign in if DB operation fails
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - add user data to token
      if (user && account) {
        token.id = user.id;
        token.email = user.email;
        // Fetch role from DB
        if (user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true, role: true },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
            }
          } catch (error) {
            console.error("[AUTH] Error fetching user role:", error);
          }
        }
      }

      // Refresh role from DB on each request (in case role changed)
      if (token.email && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("[AUTH] Error refreshing user role:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export { getServerSession };