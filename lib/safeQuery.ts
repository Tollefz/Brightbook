import { isDevelopment, isDatabaseConfigured } from "@/lib/utils/database-check";

/**
 * Run a Prisma/database query safely without crashing the app.
 * On failure it logs and returns the provided fallback value.
 * 
 * In development: If database is not configured, silently returns fallback.
 * In production: Always logs errors and returns fallback.
 */
export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  label?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isDev = isDevelopment();
    const dbConfigured = isDatabaseConfigured();
    
    // In development, if DB is not configured, silently return fallback
    if (isDev && !dbConfigured) {
      // Don't log errors in dev when DB is not configured - it's expected
      return fallback;
    }
    
    // Extract detailed error information
    const errorMessage = error?.message || String(error);
    const errorName = error?.name || "UnknownError";
    const errorCode = error?.code || null;
    
    // Extract database connection info (mask credentials)
    let dbInfo = null;
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        const url = new URL(dbUrl);
        dbInfo = {
          host: url.hostname,
          port: url.port || '5432',
          database: url.pathname.replace(/^\//, ''),
          user: url.username ? `${url.username.substring(0, 3)}***` : 'unknown',
        };
      }
    } catch {
      // Ignore URL parsing errors
    }
    
    // Build detailed error log
    const errorDetails: any = {
      error: errorMessage,
      name: errorName,
      ...(errorCode && { code: errorCode }),
      ...(error?.cause && { cause: error.cause }),
      ...(dbInfo && { database: dbInfo }),
    };
    
    // Add Prisma-specific error details
    if (errorName === 'PrismaClientKnownRequestError' || errorName === 'PrismaClientValidationError') {
      errorDetails.prismaError = true;
      if (error?.meta) {
        errorDetails.meta = error.meta;
      }
    }
    
    if (isDev) {
      console.error(
        `❌ Failed to run query${label ? ` (${label})` : ''}`,
        errorDetails
      );
      
      // Provide helpful hints based on error type
      if (errorMessage.includes("Can't reach database server")) {
        console.error('💡 Hint: Database server is not reachable. Check DATABASE_URL and network connection.');
      } else if (errorMessage.includes("Unknown argument") || errorMessage.includes("Unknown field")) {
        console.error('💡 Hint: Field does not exist in Prisma schema. Run: npx prisma generate && npx prisma db push');
      } else if (errorMessage.includes("Column") && errorMessage.includes("does not exist")) {
        console.error('💡 Hint: Database column missing. Run: npx prisma migrate dev or npx prisma db push');
      } else if (errorMessage.includes("Prisma Client has not been generated")) {
        console.error('💡 Hint: Prisma Client not generated. Run: npx prisma generate');
      }
    } else {
      // In production, log but don't expose details
      console.error(
        `Failed to run query${label ? ` (${label})` : ''}`,
        errorMessage
      );
    }
    
    return fallback;
  }
}

