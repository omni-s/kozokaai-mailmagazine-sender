import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';
import { Config, ConfigSchema } from './config-schema';

/**
 * S3 Client（遅延初期化）
 *
 * 必要な環境変数:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 */
let s3ClientInstance: S3Client | null = null;

/**
 * S3 Clientを取得（初回呼び出し時に初期化）
 */
function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  // 環境変数チェック（初回のみ）
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_ACCESS_KEY_ID environment variable is not set');
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set');
  }
  if (!process.env.AWS_REGION) {
    throw new Error('AWS_REGION environment variable is not set');
  }

  s3ClientInstance = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return s3ClientInstance;
}

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
  '.tsx': 'text/plain',
  '.html': 'text/html',
  '.json': 'application/json',
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
      client: getS3Client(),
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

/**
 * ディレクトリ内のすべてのファイルをS3に再帰的にアップロード
 *
 * @param localDir - ローカルディレクトリパス
 * @param s3Prefix - S3のプレフィックス（ディレクトリパス）
 * @param bucketName - S3バケット名（環境変数から取得）
 * @returns アップロード結果のリスト
 */
export async function uploadDirectoryToS3Recursive(
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

  async function processDirectory(currentDir: string, currentPrefix: string) {
    try {
      // ディレクトリ存在チェック
      if (!fs.existsSync(currentDir)) {
        console.error(`Directory not found: ${currentDir}`);
        return;
      }

      // ディレクトリ内のファイル一覧取得
      const entries = fs.readdirSync(currentDir);

      // 各エントリを処理
      for (const entry of entries) {
        const localPath = path.join(currentDir, entry);
        const stat = fs.statSync(localPath);

        if (stat.isDirectory()) {
          // サブディレクトリを再帰的に処理
          await processDirectory(localPath, `${currentPrefix}/${entry}`);
        } else {
          // ファイルをアップロード
          const s3Key = `${currentPrefix}/${entry}`;
          const result = await uploadFileToS3(localPath, s3Key, bucketName);

          // ファイルパスは相対パスで記録
          const relativePath = path.relative(localDir, localPath);
          results.push({
            file: relativePath.replace(/\\/g, '/'),
            ...result,
          });
        }
      }
    } catch (error) {
      console.error('Directory Upload Error:', error);
    }
  }

  await processDirectory(localDir, s3Prefix);
  return results;
}

/**
 * アーカイブメタデータ（mail.tsx, mail.html, config.json）をS3にアップロード
 * @param archiveDir - アーカイブディレクトリ（src/archives/YYYY/MM/DD-MSG）
 * @param s3Prefix - S3プレフィックス（archives/YYYY/MM/DD-MSG）
 * @param bucketName - S3バケット名（環境変数から取得）
 * @returns アップロード結果のリスト
 */
export async function uploadArchiveMetadataToS3(
  archiveDir: string,
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

  // mail.tsx をアップロード
  const mailTsxPath = path.join(archiveDir, 'mail.tsx');
  if (fs.existsSync(mailTsxPath)) {
    const s3Key = `${s3Prefix}/mail.tsx`;
    const result = await uploadFileToS3(mailTsxPath, s3Key, bucketName);
    results.push({ file: 'mail.tsx', ...result });
  }

  // mail.html をアップロード
  const mailHtmlPath = path.join(archiveDir, 'mail.html');
  if (fs.existsSync(mailHtmlPath)) {
    const s3Key = `${s3Prefix}/mail.html`;
    const result = await uploadFileToS3(mailHtmlPath, s3Key, bucketName);
    results.push({ file: 'mail.html', ...result });
  }

  // config.json をアップロード
  const configPath = path.join(archiveDir, 'config.json');
  if (fs.existsSync(configPath)) {
    const s3Key = `${s3Prefix}/config.json`;
    const result = await uploadFileToS3(configPath, s3Key, bucketName);
    results.push({ file: 'config.json', ...result });
  }

  return results;
}

/**
 * S3から最新のアーカイブを取得
 *
 * @param directoryName - ディレクトリ名でフィルタ（末尾一致）
 * @param bucketName - S3バケット名（環境変数から取得）
 * @returns アーカイブメタデータまたはエラー
 */
export async function getLatestArchiveFromS3(
  directoryName?: string,
  bucketName?: string
): Promise<
  | { success: true; yyyy: string; mm: string; ddMsg: string; lastModified: Date }
  | { success: false; error: string }
> {
  const bucket = bucketName || process.env.S3_BUCKET_NAME;

  if (!bucket) {
    return { success: false, error: 'S3_BUCKET_NAME is not set' };
  }

  try {
    // S3から archives/ プレフィックスのオブジェクト一覧を取得
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'archives/',
      MaxKeys: 1000,
    });

    const response = await getS3Client().send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return { success: false, error: 'No archives found in S3' };
    }

    // config.json で終わるキーのみをフィルタリング
    const configFiles = response.Contents.filter(
      (obj) => obj.Key && obj.Key.endsWith('/config.json')
    );

    if (configFiles.length === 0) {
      return { success: false, error: 'No config.json files found in archives/' };
    }

    // LastModified で降順ソート（最新が先頭）
    configFiles.sort((a, b) => {
      const dateA = a.LastModified?.getTime() || 0;
      const dateB = b.LastModified?.getTime() || 0;
      return dateB - dateA;
    });

    // 最新のアーカイブからメタデータを抽出
    for (const file of configFiles) {
      if (!file.Key) continue;

      // 正規表現でパスをパース: archives/YYYY/MM/DD-MSG/config.json
      let pattern: RegExp;
      if (directoryName) {
        // directoryName が指定された場合、末尾一致でフィルタ
        // 例: "summer-sale" → archives/2026/01/14-summer-sale/config.json
        // 正規表現をエスケープ
        const escaped = directoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`^archives\\/(\\d{4})\\/(\\d{2})\\/((?:[^\\/])*${escaped})\\/config\\.json$`);
      } else {
        // directoryName が指定されない場合、すべてを対象
        pattern = /^archives\/(\d{4})\/(\d{2})\/([^/]+)\/config\.json$/;
      }

      const match = file.Key.match(pattern);

      if (match) {
        return {
          success: true,
          yyyy: match[1],
          mm: match[2],
          ddMsg: match[3],
          lastModified: file.LastModified || new Date(),
        };
      }

      // パスが不正またはマッチしない場合は次を試す
      if (!directoryName) {
        console.warn(`警告: 不正なS3アーカイブパス: ${file.Key}`);
      }
    }

    if (directoryName) {
      return { success: false, error: `No archives found matching: ${directoryName}` };
    }

    return { success: false, error: 'No valid archive paths found' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AccessDenied') {
        return { success: false, error: 'S3 Access Denied. Check AWS credentials.' };
      }
      return { success: false, error: `S3 API error: ${error.message}` };
    }
    return { success: false, error: 'Unknown S3 error' };
  }
}

/**
 * S3から全アーカイブのconfig.jsonを取得
 *
 * @param limit - 取得件数制限（LastModified降順で先頭N件のみconfigをロード）
 * @returns 全アーカイブのメタデータとconfig.jsonのリスト
 */
export async function getAllArchivesFromS3(limit?: number): Promise<
  Array<{
    yyyy: string;
    mm: string;
    ddMsg: string;
    config: Config;
  }>
> {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not set');
  }

  try {
    // S3からarchives/配下の全ディレクトリを列挙
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'archives/',
      MaxKeys: 1000,
    });

    const response = await getS3Client().send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // config.jsonで終わるキーのみをフィルタリング
    let configFiles = response.Contents.filter(
      (obj) => obj.Key && obj.Key.endsWith('/config.json')
    );

    if (configFiles.length === 0) {
      return [];
    }

    // LastModified降順ソート（最新が先頭）
    configFiles.sort((a, b) => {
      const dateA = a.LastModified?.getTime() || 0;
      const dateB = b.LastModified?.getTime() || 0;
      return dateB - dateA;
    });

    // limit指定時は先頭N件のみ処理（S3 API呼び出し削減）
    if (limit && limit > 0) {
      configFiles = configFiles.slice(0, limit);
    }

    // 各config.jsonを取得
    const results: Array<{
      yyyy: string;
      mm: string;
      ddMsg: string;
      config: Config;
    }> = [];

    for (const file of configFiles) {
      if (!file.Key) continue;

      // パスをパース: archives/YYYY/MM/DD-MSG/config.json
      const pattern = /^archives\/(\d{4})\/(\d{2})\/([^/]+)\/config\.json$/;
      const match = file.Key.match(pattern);

      if (!match) {
        console.warn(`警告: 不正なS3アーカイブパス: ${file.Key}`);
        continue;
      }

      const [, yyyy, mm, ddMsg] = match;

      // config.jsonを取得
      try {
        const config = await loadConfigFromS3(yyyy, mm, ddMsg);
        results.push({ yyyy, mm, ddMsg, config });
      } catch (error) {
        console.error(`警告: config.json読み込み失敗: ${file.Key}`, error);
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error('S3 getAllArchives Error:', error);
    throw error;
  }
}

/**
 * S3からconfig.jsonを読み込み
 *
 * @param yyyy - 年
 * @param mm - 月
 * @param ddMsg - 日-メッセージ
 * @returns Config
 */
export async function loadConfigFromS3(
  yyyy: string,
  mm: string,
  ddMsg: string
): Promise<Config> {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not set');
  }

  try {
    const s3Key = `archives/${yyyy}/${mm}/${ddMsg}/config.json`;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    const response = await getS3Client().send(command);

    if (!response.Body) {
      throw new Error('S3 response body is empty');
    }

    // Streamを文字列に変換
    const bodyString = await response.Body.transformToString('utf-8');

    // JSONパース
    const data = JSON.parse(bodyString);

    // Zodバリデーション
    const result = ConfigSchema.safeParse(data);

    if (!result.success) {
      throw new Error(`Config validation failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error('S3 loadConfig Error:', error);
    throw error;
  }
}

/**
 * S3のconfig.jsonを更新
 *
 * @param yyyy - 年
 * @param mm - 月
 * @param ddMsg - 日-メッセージ
 * @param sentAt - 送信日時
 */
export async function updateConfigSentAt(
  yyyy: string,
  mm: string,
  ddMsg: string,
  sentAt: string
): Promise<void> {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not set');
  }

  try {
    // S3からconfig.jsonを取得
    const config = await loadConfigFromS3(yyyy, mm, ddMsg);

    // sentAtを更新
    config.sentAt = sentAt;

    // S3に書き戻す
    const s3Key = `archives/${yyyy}/${mm}/${ddMsg}/config.json`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: JSON.stringify(config, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read',
    });

    await getS3Client().send(command);
  } catch (error) {
    console.error('S3 updateConfigSentAt Error:', error);
    throw error;
  }
}

/**
 * S3のconfig.jsonの任意フィールドを更新
 *
 * @param yyyy - 年
 * @param mm - 月
 * @param ddMsg - 日-メッセージ
 * @param updates - 更新するフィールド（sentAt, status など）
 */
export async function updateConfigFields(
  yyyy: string,
  mm: string,
  ddMsg: string,
  updates: { sentAt?: string; status?: string }
): Promise<void> {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not set');
  }

  try {
    // S3からconfig.jsonを取得
    const config = await loadConfigFromS3(yyyy, mm, ddMsg);

    // 指定されたフィールドを上書き
    if (updates.sentAt !== undefined) {
      config.sentAt = updates.sentAt;
    }
    if (updates.status !== undefined) {
      (config as Record<string, unknown>).status = updates.status;
    }

    // S3に書き戻す
    const s3Key = `archives/${yyyy}/${mm}/${ddMsg}/config.json`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: JSON.stringify(config, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read',
    });

    await getS3Client().send(command);

    // ローカル config.json も同時更新（Git commit で差分を生成するため）
    const localPath = path.join(
      process.cwd(), 'src', 'archives', yyyy, mm, ddMsg, 'config.json'
    );
    if (fs.existsSync(localPath)) {
      const localConfig = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
      if (updates.sentAt !== undefined) localConfig.sentAt = updates.sentAt;
      if (updates.status !== undefined) localConfig.status = updates.status;
      fs.writeFileSync(localPath, JSON.stringify(localConfig, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('S3 updateConfigFields Error:', error);
    throw error;
  }
}

/**
 * S3から対象アーカイブを取得（directoryName指定版）
 *
 * @param directoryName - ディレクトリ名
 * @returns アーカイブメタデータまたはnull
 */
export async function getTargetArchiveFromS3(
  directoryName: string
): Promise<{
  yyyy: string;
  mm: string;
  ddMsg: string;
} | null> {
  const result = await getLatestArchiveFromS3(directoryName);

  if (result.success) {
    return {
      yyyy: result.yyyy,
      mm: result.mm,
      ddMsg: result.ddMsg,
    };
  }

  return null;
}

/**
 * S3からmail.htmlを読み込み
 *
 * @param yyyy - 年
 * @param mm - 月
 * @param ddMsg - 日-メッセージ
 * @returns HTML文字列またはエラー
 */
export async function loadMailHtmlFromS3(
  yyyy: string,
  mm: string,
  ddMsg: string
): Promise<{ html: string } | { error: string }> {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    return { error: 'S3_BUCKET_NAME is not set' };
  }

  try {
    const s3Key = `archives/${yyyy}/${mm}/${ddMsg}/mail.html`;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    const response = await getS3Client().send(command);

    if (!response.Body) {
      return { error: 'S3 response body is empty' };
    }

    // Streamを文字列に変換
    const html = await response.Body.transformToString('utf-8');

    return { html };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Unknown error' };
  }
}

/**
 * S3からアーカイブディレクトリを削除
 *
 * @param s3ArchivePath - "YYYY/MM/DD-MSG" 形式
 */
export async function deleteArchiveFromS3(s3ArchivePath: string): Promise<void> {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not set');
  }

  // ListObjectsV2でアーカイブ配下の全オブジェクトを列挙
  const prefix = `archives/${s3ArchivePath}/`;
  console.log(`[S3 Delete] Listing objects with prefix: ${prefix} in bucket: ${bucket}`);

  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });
  const listResponse = await getS3Client().send(listCommand);

  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    console.warn(`[S3 Delete] No objects found with prefix: ${prefix}`);
    return;
  }

  // DeleteObjectsCommandでバルク削除（1000件上限対応）
  const objects = listResponse.Contents
    .filter((obj) => obj.Key)
    .map((obj) => ({ Key: obj.Key! }));

  console.log(`[S3 Delete] Deleting ${objects.length} objects:`);
  objects.forEach((obj) => console.log(`  - ${obj.Key}`));

  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: objects },
  });
  const deleteResponse = await getS3Client().send(deleteCommand);

  // 削除結果の検証
  if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
    const errorDetails = deleteResponse.Errors
      .map((e) => `${e.Key}: ${e.Code} - ${e.Message}`)
      .join('; ');
    throw new Error(`S3 deletion failed: ${errorDetails}`);
  }

  console.log(`[S3 Delete] Successfully deleted ${deleteResponse.Deleted?.length ?? 0} objects from ${prefix}`);
}
