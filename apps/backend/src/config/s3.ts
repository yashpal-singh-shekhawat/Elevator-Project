import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { InternalServerError } from '@common/errors';

// Short-lived by design: URLs are generated on demand and never persisted,
// so there's nothing to revoke and no risk of a stale public link.
const UPLOAD_URL_EXPIRY_SECONDS = 300; // 5 minutes to complete a PUT
const DOWNLOAD_URL_EXPIRY_SECONDS = 900; // 15 minutes to view/download

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({ region: env.AWS_REGION });
  return cachedClient;
}

function getBucketNameOrThrow(): string {
  if (!env.AWS_S3_BUCKET_NAME) {
    // Deliberately not a validation error — this is a server misconfiguration,
    // not something the caller can fix by changing their request.
    throw new InternalServerError('AWS_S3_BUCKET_NAME is not configured on the server');
  }
  return env.AWS_S3_BUCKET_NAME;
}

export async function generatePresignedUploadUrl(fileKey: string, contentType: string): Promise<{ uploadUrl: string; expiresInSeconds: number }> {
  const command = new PutObjectCommand({
    Bucket: getBucketNameOrThrow(),
    Key: fileKey,
    ContentType: contentType
  });
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS });
  return { uploadUrl, expiresInSeconds: UPLOAD_URL_EXPIRY_SECONDS };
}

export async function generatePresignedDownloadUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucketNameOrThrow(), Key: fileKey });
  return getSignedUrl(getClient(), command, { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS });
}

export async function deleteObject(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: getBucketNameOrThrow(), Key: fileKey });
  await getClient().send(command);
}
