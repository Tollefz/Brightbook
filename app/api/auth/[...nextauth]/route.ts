import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

// MIDLERTIDIG DEBUG: Wrapper for å fange ekte feil under NextAuth init
export async function GET(req: Request, ctx: any) {
  try {
    const handler = NextAuth(authOptions);
    return handler(req, ctx);
  } catch (err: any) {
    console.error("[NEXTAUTH DEBUG] GET error:", err);
    console.error("[NEXTAUTH DEBUG] Error name:", err?.name);
    console.error("[NEXTAUTH DEBUG] Error message:", err?.message);
    console.error("[NEXTAUTH DEBUG] Error stack:", err?.stack);
    return new Response(
      JSON.stringify({
        error: err?.message || String(err),
        name: err?.name || "UnknownError",
        stack: err?.stack || null,
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(req: Request, ctx: any) {
  try {
    const handler = NextAuth(authOptions);
    return handler(req, ctx);
  } catch (err: any) {
    console.error("[NEXTAUTH DEBUG] POST error:", err);
    console.error("[NEXTAUTH DEBUG] Error name:", err?.name);
    console.error("[NEXTAUTH DEBUG] Error message:", err?.message);
    console.error("[NEXTAUTH DEBUG] Error stack:", err?.stack);
    return new Response(
      JSON.stringify({
        error: err?.message || String(err),
        name: err?.name || "UnknownError",
        stack: err?.stack || null,
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

