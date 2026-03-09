"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "~/auth";
import { env } from "~/env";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getS3Client() {
  return new S3Client({
    region: env.AWS_REGION ?? "us-east-1",
    // Uses credentials from ~/.aws/credentials automatically
  });
}

export async function getPresignedUploadUrl(input: {
  filename: string;
  contentType: string;
  size: number;
  folder: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!ALLOWED_TYPES.includes(input.contentType)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }

  if (input.size > MAX_SIZE) {
    throw new Error("File too large. Maximum 5MB.");
  }

  if (!env.AWS_S3_BUCKET) {
    throw new Error("S3 bucket not configured");
  }

  const ext = input.filename.split(".").pop() ?? "jpg";
  const key = `${input.folder}/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });

  const url = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });

  return {
    uploadUrl: url,
    key,
    publicUrl: `https://${env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
  };
}
