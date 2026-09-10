import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName && publicUrl);
}

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId || "",
      secretAccessKey: secretAccessKey || "",
    },
  });
}

export async function uploadToR2(
  buffer: Buffer,
  originalFilename: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not fully configured in environment variables.");
  }

  const client = getR2Client();
  const timestamp = Date.now();
  const sanitized = originalFilename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `dishes/${timestamp}-${sanitized}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable", // Cache images in Cloudflare CDN for 1 year!
    })
  );

  // Normalize public URL (strip trailing slash if user entered one)
  const base = (publicUrl || "").replace(/\/+$/, "");
  return `${base}/${key}`;
}
