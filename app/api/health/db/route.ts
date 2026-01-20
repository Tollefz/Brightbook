import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for database connection
 * Tests if Prisma can connect to the database
 * Returns detailed error information without leaking credentials
 */
export async function GET() {
  // Parse sanitized database URL info (no credentials)
  let hasDatabaseUrl = false;
  let databaseUrlHost: string | null = null;
  let isPooler = false;
  let hasDirectUrl = false;

  try {
    const dbUrl = process.env.DATABASE_URL;
    hasDatabaseUrl = !!dbUrl;
    
    if (dbUrl) {
      const url = new URL(dbUrl);
      databaseUrlHost = `${url.hostname}:${url.port || "5432"}`;
      isPooler = url.hostname.includes("-pooler");
    }
  } catch {
    // Ignore URL parsing errors
  }

  hasDirectUrl = !!process.env.DIRECT_URL;

  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      ok: true,
      hasDatabaseUrl,
      databaseUrlHost,
      isPooler,
      hasDirectUrl,
    });
  } catch (error: any) {
    // Extract detailed error information
    const errorMessage = error?.message || String(error);
    const errorName = error?.name || "UnknownError";
    const errorCode = error?.code || null;
    const errorStack = error?.stack || null;
    
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        name: errorName,
        code: errorCode,
        stack: errorStack,
        hasDatabaseUrl,
        databaseUrlHost,
        isPooler,
        hasDirectUrl,
      },
      { status: 503 }
    );
  }
}

