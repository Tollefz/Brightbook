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

// Initialize NextAuth - NextAuth v4 returns handler object directly
const handler = NextAuth(authOptions);

// PROD DEBUG: Log handler structure on module load
if (typeof window === "undefined") {
  console.log("[AUTH ROUTE] Handler type:", typeof handler);
  if (handler && typeof handler === "object") {
    console.log("[AUTH ROUTE] Handler keys:", Object.keys(handler));
    console.log("[AUTH ROUTE] Has GET:", typeof (handler as any).GET);
    console.log("[AUTH ROUTE] Has POST:", typeof (handler as any).POST);
    console.log("[AUTH ROUTE] Has handlers:", typeof (handler as any).handlers);
  }
}

// NextAuth v4 standard pattern: export handler as GET and POST
// Wrap with error handling
const originalGET = handler.GET;
const originalPOST = handler.POST;

export async function GET(req: Request, context: any) {
  console.log("[AUTH ROUTE] GET request received");
  console.log(`[AUTH ROUTE] Providers configured: ${authOptions.providers?.length || 0}`);
  
  try {
    if (originalGET && typeof originalGET === "function") {
      return await originalGET(req, context);
    } else {
      console.error("[AUTH ROUTE] originalGET is not a function", typeof originalGET);
      throw new Error("NextAuth GET handler not found");
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
  console.log("[AUTH ROUTE] POST request received");
  console.log(`[AUTH ROUTE] Providers configured: ${authOptions.providers?.length || 0}`);
  
  try {
    if (originalPOST && typeof originalPOST === "function") {
      return await originalPOST(req, context);
    } else {
      console.error("[AUTH ROUTE] originalPOST is not a function", typeof originalPOST);
      throw new Error("NextAuth POST handler not found");
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

