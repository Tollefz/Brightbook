import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { join } from "path";

const expectedImages = [
  "BR.avif",
  "BR1.avif",
  "br3.avif",
  "br4.avif",
  "br5.avif",
  "br6.avif",
];

export async function GET() {
  const basePath = process.cwd();
  const publicPath = join(basePath, "public", "products", "bookbright");

  const results = expectedImages.map((filename) => {
    const filePath = join(publicPath, filename);
    const exists = existsSync(filePath);
    const urlPath = `/products/bookbright/${filename}`;

    return {
      filename,
      exists,
      expectedUrl: urlPath, // Expected URL path for browser access
      filePath: filePath.replace(basePath, "."), // Relative path for readability
    };
  });

  const allExist = results.every((r) => r.exists);
  const missingFiles = results.filter((r) => !r.exists).map((r) => r.filename);

  return NextResponse.json({
    success: allExist,
    message: allExist
      ? "All image files exist"
      : `Missing files: ${missingFiles.join(", ")}`,
    basePath: publicPath.replace(basePath, "."),
    files: results,
    summary: {
      total: expectedImages.length,
      found: results.filter((r) => r.exists).length,
      missing: missingFiles.length,
    },
  });
}

