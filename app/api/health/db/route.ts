import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint for database connection
 * Tests if Prisma can connect to the database
 */
export async function GET() {
  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      ok: true,
    });
  } catch (error: any) {
    // Extract error message
    const errorMessage = error?.message || String(error);
    const errorName = error?.name || "UnknownError";
    
    // Try to extract host from DATABASE_URL (without password)
    let hostHint = null;
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        const url = new URL(dbUrl);
        hostHint = `${url.hostname}:${url.port || "5432"}`;
      }
    } catch {
      // Ignore URL parsing errors
    }
    
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        errorName,
        hostHint,
      },
      { status: 503 }
    );
  }
}

