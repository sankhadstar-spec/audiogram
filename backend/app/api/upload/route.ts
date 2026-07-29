// POST /api/upload
// Returns a presigned PUT URL so the client can stream the file directly to R2
// without it passing through the Next.js server (avoids Vercel's 4.5 MB body limit
// and egress costs on large audio/video files).
//
// Body: { filename: string; contentType: string }
// Response: { uploadUrl: string; publicUrl: string }

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { filename, contentType } = await req.json();
  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
  }

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    return NextResponse.json(
      { error: "R2 storage not configured — set R2_* env vars" },
      { status: 503 }
    );
  }

  // Unique key: userId/timestamp-originalFilename to avoid collisions
  const userId = (session.user as { id: string }).id;
  const key = `${userId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  // Build the presigned PUT URL using the AWS Signature v4 approach
  // (Cloudflare R2 is S3-compatible)
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`; // adjust if using a custom domain

  // Dynamically import the AWS SDK — only runs server-side, tree-shaken from client
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, ContentType: contentType }),
    { expiresIn: 3600 } // 1 hour — plenty of time for a 100 MB file upload
  );

  return NextResponse.json({ uploadUrl, publicUrl });
}
