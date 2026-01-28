export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const url = new URL(cloudinaryUrl);

    // Everything after /upload/
    const parts = url.pathname.split("/upload/");
    if (parts.length !== 2) return null;

    const afterUpload = parts[1]; // v1769497235/kice2ii2i66aoxqqbixi.pdf

    // Remove version prefix (v123456/)
    const noVersion = afterUpload.replace(/^v\d+\//, "");

    // Remove file extension (.pdf, .jpg, etc.)
    const publicId = noVersion.replace(/\.[^/.]+$/, "");

    return publicId || null;
  } catch {
    return null;
  }
}