import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import GitHub from "next-auth/providers/github";

// Get GitHub env vars
const githubId = process.env.GITHUB_ID;
const githubSecret = process.env.GITHUB_SECRET;

// Hard fail at runtime (not during build) if GitHub env vars are missing
// During build, Next.js evaluates modules, so we allow undefined for build
// But at runtime in production, we must have these values
// We validate in the route handler to avoid breaking builds
function validateGitHubEnv() {
  if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
    if (!githubId || !githubSecret) {
      throw new Error("Missing GITHUB_ID or GITHUB_SECRET environment variables");
    }
  }
}

// Export validation function for use in route handler
export function validateAuthConfig() {
  validateGitHubEnv();
}

// Always include GitHub provider (required for NextAuth)
// If env vars are missing, it will fail at runtime when used
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHub({
      clientId: githubId || "",
      clientSecret: githubSecret || "",
    }),
  ],
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export { getServerSession };