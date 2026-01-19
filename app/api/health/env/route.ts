import { NextResponse } from "next/server";

/**
 * Health check endpoint for environment variables
 * Returns which required env vars are present (without logging values)
 */
export async function GET() {
  const envVars = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    GITHUB_ID: !!(process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID),
    GITHUB_SECRET: !!(process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET),
  };

  const allPresent = Object.values(envVars).every((v) => v === true);

  return NextResponse.json({
    ok: allPresent,
    env: envVars,
  });
}

