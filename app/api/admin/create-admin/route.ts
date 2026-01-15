import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";

/**
 * API route for å opprette/oppdatere admin-bruker
 * Bruk kun i development eller med autentisering i produksjon
 */
export async function POST() {
  try {
    const adminEmail = "rob.tol@hotmail.com";
    const adminPassword = "Tollef220900";

    const passwordHash = await hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      create: {
        email: adminEmail.toLowerCase(),
        password: passwordHash,
        role: "admin",
        name: "Admin",
      },
      update: {
        password: passwordHash,
        role: "admin",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin-bruker opprettet/oppdatert",
      email: admin.email,
      id: admin.id,
    });
  } catch (error: any) {
    console.error("Feil ved opprettelse av admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Kunne ikke opprette admin-bruker",
        details: error.code || "Unknown error",
      },
      { status: 500 }
    );
  }
}

