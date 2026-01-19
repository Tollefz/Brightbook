import { NextResponse } from "next/server";

/**
 * Debug endpoint to check environment variables
 * Only available in development or with DEBUG_ENV=true
 */
export async function GET() {
  const isDebugEnabled =
    process.env.NODE_ENV === "development" || process.env.DEBUG_ENV === "true";

  if (!isDebugEnabled) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  // Check auth-related env vars (without exposing secrets)
  const authEnv = {
    GITHUB_ID: process.env.GITHUB_ID ? "✅ Set" : "❌ Missing",
    GITHUB_SECRET: process.env.GITHUB_SECRET ? "✅ Set" : "❌ Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "❌ Missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
    DISABLE_ADMIN_AUTH: process.env.DISABLE_ADMIN_AUTH || "false",
  };

  // Check site config
  const siteEnv = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "❌ Missing",
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    auth: authEnv,
    site: siteEnv,
    timestamp: new Date().toISOString(),
  });
}

