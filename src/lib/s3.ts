import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';

/**
 * S3 Client初期化
 *
 * 必要な環境変数:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 */
if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('AWS_ACCESS_KEY_ID environment variable is not set');
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set');
}
if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable is not set');
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * MIME typeマップ
 */
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/**
 * ファイル拡張子からContent-Typeを取得
 *
 * @param filePath - ファイルパス
 * @returns Content-Type
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * S3にファイルをアップロード
 *
 * @param localPath - ローカルファイルパス
 * @param s3Key - S3のキー（パス）
 * @param bucketName - S3バケット名（環境変数から取得）
 * @returns アップロード結果
 */
export async function uploadFileToS3(
  localPath: string,
  s3Key: string,
  bucketName?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const bucket = bucketName || process.env.S3_BUCKET_NAME;

  if (!bucket) {
    return { success: false, error: 'S3_BUCKET_NAME is not set' };
  }

  try {
    // ファイル存在チェック
    if (!fs.existsSync(localPath)) {
      return { success: false, error: `File not found: ${localPath}` };
    }

    // ファイル読み込み
    const fileContent = fs.readFileSync(localPath);
    const contentType = getContentType(localPath);

    // S3アップロード
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
        ACL: 'public-read', // パブリック読み取り許可
      },
    });

    await upload.done();

    // アップロード完了後のURL
    const s3Url = process.env.S3_BUCKET_URL
      ? `${process.env.S3_BUCKET_URL}/${s3Key}`
      : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return { success: true, url: s3Url };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ディレクトリ内のすべてのファイルをS3にアップロード
 *
 * @param localDir - ローカルディレクトリパス
 * @param s3Prefix - S3のプレフィックス（ディレクトリパス）
 * @param bucketName - S3バケット名（環境変数から取得）
 * @returns アップロード結果のリスト
 */
export async function uploadDirectoryToS3(
  localDir: string,
  s3Prefix: string,
  bucketName?: string
): Promise<
  Array<{
    file: string;
    success: boolean;
    url?: string;
    error?: string;
  }>
> {
  const results: Array<{
    file: string;
    success: boolean;
    url?: string;
    error?: string;
  }> = [];

  try {
    // ディレクトリ存在チェック
    if (!fs.existsSync(localDir)) {
      console.error(`Directory not found: ${localDir}`);
      return results;
    }

    // ディレクトリ内のファイル一覧取得
    const files = fs.readdirSync(localDir);

    // 各ファイルをアップロード
    for (const file of files) {
      const localPath = path.join(localDir, file);
      const stat = fs.statSync(localPath);

      // ディレクトリはスキップ
      if (stat.isDirectory()) {
        continue;
      }

      const s3Key = `${s3Prefix}/${file}`;
      const result = await uploadFileToS3(localPath, s3Key, bucketName);

      results.push({
        file,
        ...result,
      });
    }

    return results;
  } catch (error) {
    console.error('Directory Upload Error:', error);
    return results;
  }
}
