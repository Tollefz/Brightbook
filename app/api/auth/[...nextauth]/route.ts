import NextAuth from "next-auth";
import { authOptions, validateAuthConfig } from "@/lib/auth";

export const runtime = "nodejs";

const baseHandler = NextAuth(authOptions);

// Wrap handlers to validate GitHub env vars at runtime (not during build)
// This only runs when requests are handled, not during build
const wrappedHandler = {
  GET: async (req: Request, context: any) => {
    if (process.env.NODE_ENV === "production") {
      validateAuthConfig();
    }
    return baseHandler.GET(req, context);
  },
  POST: async (req: Request, context: any) => {
    if (process.env.NODE_ENV === "production") {
      validateAuthConfig();
    }
    return baseHandler.POST(req, context);
  },
};

export const GET = wrappedHandler.GET;
export const POST = wrappedHandler.POST;

