import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { validateConfig } from './config-schema';

/**
 * メールアーカイブ情報
 */
export interface MailArchive {
  yyyy: string; // "2024"
  mm: string; // "05"
  ddMsg: string; // "20-summer-sale"
  subject: string;
  segmentId?: string; // UUID形式（推奨）
  audienceId?: string; // aud_xxx形式（非推奨、後方互換性のため残す）
  sentAt: string | null;
  path: string; // "2024/05/20-summer-sale"
  createdAt: Date;
}

/**
 * S3 Client初期化
 *
 * 必要な環境変数:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - S3_BUCKET_NAME
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

/**
 * S3からオブジェクトを取得（ヘルパー関数）
 *
 * @param key - S3オブジェクトキー
 * @returns オブジェクトの内容（文字列）、取得失敗時はnull
 */
async function getS3Object(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return null;
    }

    // StreamをStringに変換
    const bodyContents = await response.Body.transformToString();
    return bodyContents;
  } catch (error) {
    console.warn(`Failed to get S3 object: ${key}`, error);
    return null;
  }
}

/**
 * アーカイブ一覧を取得
 *
 * S3の archives/ ディレクトリを走査し、
 * 各アーカイブの config.json を読み込んでMailArchive[]を返却
 *
 * @returns MailArchive[] - 日付降順でソート済み
 */
export async function getArchiveList(): Promise<MailArchive[]> {
  try {
    // S3から archives/ 配下のすべてのオブジェクトを取得
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: 'archives/',
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    // config.jsonのみをフィルタリング
    const configKeys = response.Contents
      .filter((obj) => obj.Key?.endsWith('config.json'))
      .map((obj) => obj.Key!);

    // 各config.jsonを取得してMailArchiveに変換
    const archives: MailArchive[] = [];

    for (const key of configKeys) {
      const configResult = await getS3Object(key);
      if (!configResult) continue;

      try {
        const configData = JSON.parse(configResult);

        // Zodスキーマでバリデーション
        const result = validateConfig(configData);
        if (!result.success) {
          console.warn(`Invalid config.json: ${key}`);
          continue;
        }

        const config = result.data!;

        // パスからYYYY/MM/DD-MSGを抽出
        // archives/2026/01/05-test/config.json → 2026, 01, 05-test
        const pathParts = key.split('/');
        if (pathParts.length < 5) {
          console.warn(`Invalid path format: ${key}`);
          continue;
        }

        const yyyy = pathParts[1];
        const mm = pathParts[2];
        const ddMsg = pathParts[3];

        // S3のLastModifiedを使用（createdAt代替）
        const s3Object = response.Contents.find((obj) => obj.Key === key);
        const createdAt = s3Object?.LastModified || new Date();

        archives.push({
          yyyy,
          mm,
          ddMsg,
          subject: config.subject,
          segmentId: config.segmentId,
          audienceId: config.audienceId,
          sentAt: config.sentAt,
          path: `${yyyy}/${mm}/${ddMsg}`,
          createdAt,
        });
      } catch (error) {
        console.warn(`Failed to parse config.json: ${key}`, error);
      }
    }

    // 日付降順ソート（送信日優先、未送信は作成日でソート）
    archives.sort((a, b) => {
      const aDate = a.sentAt ? new Date(a.sentAt) : a.createdAt;
      const bDate = b.sentAt ? new Date(b.sentAt) : b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    return archives;
  } catch (error) {
    console.error('Failed to fetch archive list from S3:', error);
    return [];
  }
}

/**
 * 特定のアーカイブを取得
 *
 * @param yyyy - 年（4桁の数字）
 * @param mm - 月（2桁の数字）
 * @param ddMsg - 日付とメッセージ名（DD-MSG 形式、日本語可、URLエンコード済みも可）
 * @returns MailArchive | null
 */
export async function getArchive(
  yyyy: string,
  mm: string,
  ddMsg: string
): Promise<MailArchive | null> {
  // URLエンコードされている可能性があるためデコード
  let decodedDdMsg: string;
  try {
    decodedDdMsg = decodeURIComponent(ddMsg);
  } catch {
    // デコード失敗時はそのまま使用
    decodedDdMsg = ddMsg;
  }

  // パスインジェクション対策
  // yyyy: 4桁の数字のみ
  if (!/^\d{4}$/.test(yyyy)) return null;
  // mm: 2桁の数字のみ
  if (!/^\d{2}$/.test(mm)) return null;
  // ddMsg: 危険なパス操作文字（.., /, \, null byte）を禁止し、日本語を含む一般的な文字を許可
  if (!decodedDdMsg || decodedDdMsg.includes('..') || decodedDdMsg.includes('/') || decodedDdMsg.includes('\\') || decodedDdMsg.includes('\0')) {
    return null;
  }

  try {
    // S3からconfig.jsonを取得
    const configKey = `archives/${yyyy}/${mm}/${decodedDdMsg}/config.json`;
    const configResult = await getS3Object(configKey);

    if (!configResult) {
      return null;
    }

    const configData = JSON.parse(configResult);

    // Zodスキーマでバリデーション
    const result = validateConfig(configData);
    if (!result.success) {
      return null;
    }

    const config = result.data!;

    // S3のオブジェクトメタデータを取得してcreatedAtを設定
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: configKey,
      MaxKeys: 1,
    });

    const response = await s3Client.send(command);
    const s3Object = response.Contents?.[0];
    const createdAt = s3Object?.LastModified || new Date();

    return {
      yyyy,
      mm,
      ddMsg: decodedDdMsg,
      subject: config.subject,
      segmentId: config.segmentId,
      audienceId: config.audienceId,
      sentAt: config.sentAt,
      path: `${yyyy}/${mm}/${decodedDdMsg}`,
      createdAt,
    };
  } catch (error) {
    console.error(`Failed to fetch archive ${yyyy}/${mm}/${decodedDdMsg} from S3:`, error);
    return null;
  }
}
