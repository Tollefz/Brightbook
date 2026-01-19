import NextAuth from "next-auth";
import { authOptions, validateAuthConfig } from "@/lib/auth";

export const runtime = "nodejs";

// PROD DEBUG: Log auth config on module load (server-side only)
if (typeof window === "undefined") {
  const githubId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
  const githubSecret = process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  console.log("[AUTH ROUTE] Module loaded - checking providers:");
  console.log(`[AUTH ROUTE] Providers count: ${authOptions.providers?.length || 0}`);
  console.log(`[AUTH ROUTE] Provider IDs: ${authOptions.providers?.map((p: any) => p.id).join(", ") || "none"}`);
  
  const missing = [];
  if (!githubId) missing.push("GITHUB_ID/GITHUB_CLIENT_ID");
  if (!githubSecret) missing.push("GITHUB_SECRET/GITHUB_CLIENT_SECRET");
  if (!nextAuthUrl) missing.push("NEXTAUTH_URL");
  if (!nextAuthSecret) missing.push("NEXTAUTH_SECRET");
  
  if (missing.length > 0) {
    console.error(`[AUTH ROUTE] MISSING ENV VARS: ${missing.join(", ")}`);
  } else {
    console.log("[AUTH ROUTE] All env vars present (values not logged)");
  }
}

// Safe mode: Validate but don't fail hard
// This allows the route to respond even if auth is not fully configured
try {
  validateAuthConfig();
} catch (error) {
  console.error("[AUTH ROUTE] Config validation error (non-fatal):", error);
}

// Initialize NextAuth and get handlers
const handler = NextAuth(authOptions);
const { handlers } = handler;

// Export GET and POST with error handling
export async function GET(req: Request, context: any) {
  // PROD DEBUG: Log on each request
  console.log("[AUTH ROUTE] GET request received");
  console.log(`[AUTH ROUTE] Providers configured: ${authOptions.providers?.length || 0}`);
  
  try {
    if (handlers && typeof handlers.GET === "function") {
      return await handlers.GET(req, context);
    } else {
      console.error("[AUTH ROUTE] handlers.GET is not a function", typeof handlers, handlers);
      throw new Error("NextAuth handlers not properly initialized");
    }
  } catch (error) {
    console.error("[AUTH ROUTE] GET handler error:", error);
    console.error("[AUTH ROUTE] Error stack:", (error as Error).stack);
    return new Response(
      JSON.stringify({ error: "Authentication service temporarily unavailable" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(req: Request, context: any) {
  // PROD DEBUG: Log on each request
  console.log("[AUTH ROUTE] POST request received");
  console.log(`[AUTH ROUTE] Providers configured: ${authOptions.providers?.length || 0}`);
  
  try {
    if (handlers && typeof handlers.POST === "function") {
      return await handlers.POST(req, context);
    } else {
      console.error("[AUTH ROUTE] handlers.POST is not a function", typeof handlers, handlers);
      throw new Error("NextAuth handlers not properly initialized");
    }
  } catch (error) {
    console.error("[AUTH ROUTE] POST handler error:", error);
    console.error("[AUTH ROUTE] Error stack:", (error as Error).stack);
    return new Response(
      JSON.stringify({ error: "Authentication service temporarily unavailable" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

