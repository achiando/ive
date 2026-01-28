import { extractPublicId } from "@/lib/utils/public_id";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { url: cloudinaryUrl, fileName } = await req.json();

    if (!cloudinaryUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const publicId = extractPublicId(cloudinaryUrl);
    if (!publicId) {
      return NextResponse.json({
        error: "Invalid Cloudinary URL or public ID not found"
      }, { status: 400 });
    }

    // Query Cloudinary to get the actual resource metadata
    let resourceDetails = null;
    let actualResourceType: "image" | "raw" | "video" = "image";

    for (const resourceType of ["image", "raw", "video"] as const) {
      try {
        resourceDetails = await cloudinary.api.resource(publicId, {
          resource_type: resourceType,
        });
        actualResourceType = resourceType;
        break;
      } catch (err: any) {
        if (err.error?.http_code !== 404) {
          throw err;
        }
      }
    }

    if (!resourceDetails) {
      return NextResponse.json({
        error: `Resource not found in Cloudinary with public_id: ${publicId}`
      }, { status: 404 });
    }

    const format = resourceDetails.format;

    // Extract the base filename from the publicId
    const baseFilename = publicId.split('/').pop();
    const fileNameWithExtension = `${baseFilename}.${format}`;

    // Generate download URL with fl_attachment to force download
    const downloadUrl = cloudinary.url(`${publicId}.${format}`, {
      resource_type: actualResourceType,
      type: resourceDetails.type,
      flags: fileName
        ? `attachment:${fileName}`
        : "attachment",
      secure: true,
    });


    return NextResponse.json({
      url: downloadUrl,
      metadata: {
        resource_type: actualResourceType,
        format: format,
        public_id: publicId,
        size: resourceDetails.bytes,
      }
    });

  } catch (err: any) {
    console.error("Download URL error:", err);
    return NextResponse.json({
      error: err.message || "Failed to generate download URL",
      details: err.error || {}
    }, { status: 500 });
  }
}