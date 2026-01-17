import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * POST /api/admin/upload-image
 * Upload one or more images to Cloudinary
 * Requires admin authentication
 * 
 * Body: multipart/form-data with files
 * Returns: { urls: string[] }
 */
export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("[upload-image] Cloudinary not configured");
    return NextResponse.json(
      { error: "Bildeopplasting er ikke konfigurert. Kontakt administrator." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    // Validate number of files
    if (files.length === 0) {
      return NextResponse.json({ error: "Ingen filer sendt" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maks ${MAX_FILES} bilder kan lastes opp samtidig` },
        { status: 400 }
      );
    }

    // Validate and upload files
    const uploadPromises = files.map(async (file) => {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Filtypen ${file.type} er ikke tillatt. Tillatte typer: jpg, png, webp, gif, avif`);
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Bildet ${file.name} er for stort. Maks størrelse: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Convert File to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary
      return new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "bookbright/products",
              resource_type: "image",
              allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
              transformation: [
                { quality: "auto" },
                { fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) {
                reject(new Error(`Feil ved opplasting: ${error.message}`));
              } else if (!result?.secure_url) {
                reject(new Error("Ingen URL mottatt fra Cloudinary"));
              } else {
                resolve(result.secure_url);
              }
            }
          )
          .end(buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("[upload-image] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ukjent feil ved opplasting";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

