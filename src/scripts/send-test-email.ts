import 'dotenv/config';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getLatestArchiveFromS3 } from '../lib/s3';
import { resend } from '../lib/resend';
import { validateConfig, type Config } from '../lib/config-schema';

/**
 * GitHub Actions Staging Workflow用テストメール送信スクリプト
 *
 * 最新コミットのメッセージから対象archiveを特定し、以下を実行:
 * 1. S3からmail.htmlとconfig.jsonを取得
 * 2. 画像パス置換（/mail-assets/ → S3 URL）
 * 3. Resend APIでテストメール送信
 *    - TEST_SEGMENT_ID設定時: Segment一斉送信（broadcasts API）
 *    - 未設定時: REVIEWER_EMAILに個別送信
 */

const PROJECT_ROOT = process.cwd();

/**
 * S3 Client初期化
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

interface TestEmailError {
  type: string;
  message: string;
  details?: string;
}

interface ArchiveMetadata {
  yyyy: string;
  mm: string;
  ddMsg: string;
}

/**
 * 最新コミットメッセージから対象archiveディレクトリ名を抽出
 * マージコミット対応: 最新10件のコミットから "MAIL:" プレフィックスを検索
 */
function getTargetArchiveFromCommit(): string | null {
  try {
    // 最新10件のコミットから "MAIL:" プレフィックスを持つコミットを検索
    const commitMessages = execSync('git log -10 --format=%s', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim().split('\n');

    console.log(chalk.cyan(`コミット履歴を検索中...`));

    for (const commitMessage of commitMessages) {
      const match = commitMessage.match(/^MAIL:\s*(.+)$/);
      if (match) {
        console.log(chalk.cyan(`検出されたコミット: ${commitMessage}`));
        const directoryName = match[1].trim();
        console.log(chalk.cyan(`検出されたディレクトリ名: ${directoryName}`));
        return directoryName;
      }
    }

    console.log(chalk.yellow('MAIL: プレフィックスを持つコミットが見つかりませんでした'));
    return null;
  } catch (error) {
    console.error(chalk.red('エラー: git log の実行に失敗しました'));
    console.error(error);
    return null;
  }
}

/**
 * S3から最新のアーカイブを取得してArchiveMetadataを返す
 */
async function getTargetArchiveFromS3(directoryName?: string): Promise<ArchiveMetadata | null> {
  const result = await getLatestArchiveFromS3(directoryName);

  if (!result.success) {
    console.error(chalk.red(`S3エラー: ${result.error}`));
    return null;
  }

  console.log(chalk.green('✓ S3から最新アーカイブを検出しました'));
  console.log(chalk.gray(`  LastModified: ${result.lastModified.toISOString()}`));

  return {
    yyyy: result.yyyy,
    mm: result.mm,
    ddMsg: result.ddMsg,
  };
}

/**
 * S3からオブジェクトを取得
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

    const bodyContents = await response.Body.transformToString();
    return bodyContents;
  } catch (error) {
    console.error(`Failed to get S3 object: ${key}`, error);
    return null;
  }
}

/**
 * 画像パスを /MAIL-ASSETS/ から S3 URL に置換
 */
function replaceImagePaths(
  html: string,
  s3BaseUrl: string,
  yyyy: string,
  mm: string,
  ddMsg: string
): string {
  const pattern = /<[Ii]mg[^>]*src=['"]\/MAIL-ASSETS\/([^'"]+)['"]/g;

  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(/\/MAIL-ASSETS\/[^'"]+/, s3Url);
  });
}

/**
 * S3からconfig.jsonを取得
 */
async function loadConfigFromS3(
  yyyy: string,
  mm: string,
  ddMsg: string
): Promise<Config | { error: string }> {
  const configKey = `archives/${yyyy}/${mm}/${ddMsg}/config.json`;

  try {
    const configContent = await getS3Object(configKey);
    if (!configContent) {
      return {
        error: `config.json が見つかりません: ${configKey}`,
      };
    }

    const configData = JSON.parse(configContent);

    // Zodスキーマでバリデーション
    const result = validateConfig(configData);
    if (!result.success) {
      const errorMessages = result.error?.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return {
        error: `config.json のバリデーションに失敗しました: ${errorMessages}`,
      };
    }

    return result.data!;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'config.json の読み込みに失敗しました',
    };
  }
}

/**
 * S3からmail.htmlを取得
 */
async function loadMailHtmlFromS3(
  yyyy: string,
  mm: string,
  ddMsg: string
): Promise<{ html: string } | { error: string }> {
  const htmlKey = `archives/${yyyy}/${mm}/${ddMsg}/mail.html`;

  try {
    const htmlContent = await getS3Object(htmlKey);
    if (!htmlContent) {
      return {
        error: `mail.html が見つかりません: ${htmlKey}`,
      };
    }

    return { html: htmlContent };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'mail.html の読み込みに失敗しました',
    };
  }
}

/**
 * Resend API でテストメール送信
 *
 * @param html - メールHTML
 * @param subject - 件名
 * @param recipientEmail - 送信先メールアドレス（個別送信時のみ使用）
 * @param segmentId - Segment ID（オプション。指定時はSegment一斉送信）
 */
async function sendTestEmail(
  html: string,
  subject: string,
  recipientEmail: string,
  segmentId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    // TEST_SEGMENT_IDが設定されている場合、Segment一斉送信
    if (segmentId) {
      // Step 1: Broadcast を作成
      const { data: createData, error: createError } = await resend.broadcasts.create({
        name: `[TEST] Broadcast - ${subject}`,
        segmentId: segmentId,
        from: fromEmail,
        subject: `[TEST] ${subject}`,
        html,
      });

      if (createError) {
        return {
          success: false,
          error: createError.message || 'Broadcast作成エラー',
        };
      }

      if (!createData?.id) {
        return {
          success: false,
          error: 'Broadcast IDが取得できませんでした',
        };
      }

      // Step 2: Broadcast を送信
      const { data: sendData, error: sendError } = await resend.broadcasts.send(createData.id);

      if (sendError) {
        return {
          success: false,
          error: sendError.message || 'Broadcast送信エラー',
        };
      }

      return {
        success: true,
        id: sendData?.id || createData.id,
      };
    }

    // TEST_SEGMENT_ID未設定の場合、REVIEWER_EMAILに個別送信
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'テストメール送信に失敗しました',
    };
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  テストメール送信'));
  console.log(chalk.blue.bold('========================================\n'));

  // 環境変数チェック
  if (!process.env.S3_BUCKET_URL) {
    console.error(
      chalk.red('エラー: S3_BUCKET_URL 環境変数が設定されていません')
    );
    process.exit(1);
  }

  // TEST_SEGMENT_ID（オプション）
  const testSegmentId = process.env.TEST_SEGMENT_ID;

  // REVIEWER_EMAIL（TEST_SEGMENT_ID未設定時は必須）
  const reviewerEmail = process.env.REVIEWER_EMAIL;

  if (!testSegmentId && !reviewerEmail) {
    console.error(
      chalk.red('エラー: TEST_SEGMENT_ID または REVIEWER_EMAIL のいずれかを設定してください')
    );
    console.error(
      chalk.yellow('ヒント: TEST_SEGMENT_ID を設定すると、Segment一斉送信でテストできます')
    );
    process.exit(1);
  }

  // 末尾スラッシュを削除して正規化
  const s3BaseUrl = (process.env.S3_BUCKET_URL || '').replace(/\/$/, '');

  // 最新コミットから対象archiveを特定
  const directoryName = getTargetArchiveFromCommit();

  let archiveMetadata: ArchiveMetadata | null = null;

  if (directoryName) {
    console.log(chalk.cyan('検出方法: Gitコミットメッセージ'));
    console.log(chalk.cyan('S3でディレクトリ名を検索中...\n'));

    // buildArchivePath() を使わず、S3で直接検索
    archiveMetadata = await getTargetArchiveFromS3(directoryName);

    if (!archiveMetadata) {
      console.log(chalk.red(`エラー: "${directoryName}" に一致するアーカイブが見つかりませんでした`));
      console.log(chalk.green('✓ テストメール送信完了（対象なし）\n'));
      process.exit(0);
    }
  } else {
    // Gitコミットから検出できない場合、S3から最新アーカイブを取得
    console.log(chalk.yellow('Gitコミットから検出できませんでした'));
    console.log(chalk.cyan('S3から最新アーカイブを取得中...\n'));

    archiveMetadata = await getTargetArchiveFromS3();

    if (!archiveMetadata) {
      console.log(chalk.yellow('S3からもアーカイブを取得できませんでした'));
      console.log(chalk.green('✓ テストメール送信完了（対象なし）\n'));
      process.exit(0);
    }
  }

  // アーカイブパスを構築
  const { yyyy, mm, ddMsg } = archiveMetadata;
  const archivePath = `archives/${yyyy}/${mm}/${ddMsg}`;

  console.log(chalk.cyan(`対象アーカイブ: ${archivePath}\n`));

  let hasError = false;
  const errors: TestEmailError[] = [];

  // 1. S3からconfig.jsonを取得
  console.log(chalk.cyan('config.jsonを取得中...'));
  const configResult = await loadConfigFromS3(yyyy, mm, ddMsg);

  if ('error' in configResult) {
    errors.push({
      type: 'config.json',
      message: 'config.json の読み込みに失敗しました',
      details: configResult.error,
    });
    hasError = true;
  }

  if (hasError) {
    console.log(chalk.red.bold('\n✗ テストメール送信でエラーが発生しました\n'));
    errors.forEach(({ type, message, details }) => {
      console.log(chalk.red(`タイプ: ${type}`));
      console.log(chalk.red(`メッセージ: ${message}`));
      if (details) {
        console.log(chalk.red(`詳細: ${details}`));
      }
      console.log();
    });
    process.exit(1);
  }

  const config = configResult as Config;
  console.log(chalk.green('✓ config.json 読み込み'));

  // 2. S3からmail.htmlを取得
  console.log(chalk.cyan('mail.htmlを取得中...'));
  const htmlResult = await loadMailHtmlFromS3(yyyy, mm, ddMsg);

  if ('error' in htmlResult) {
    errors.push({
      type: 'mail.html',
      message: 'mail.html の読み込みに失敗しました',
      details: htmlResult.error,
    });
    hasError = true;
  }

  if (hasError) {
    console.log(chalk.red.bold('\n✗ テストメール送信でエラーが発生しました\n'));
    errors.forEach(({ type, message, details }) => {
      console.log(chalk.red(`タイプ: ${type}`));
      console.log(chalk.red(`メッセージ: ${message}`));
      if (details) {
        console.log(chalk.red(`詳細: ${details}`));
      }
      console.log();
    });
    process.exit(1);
  }

  let html = (htmlResult as { html: string }).html;
  console.log(chalk.green('✓ mail.html 読み込み'));

  // 3. 画像パス置換
  html = replaceImagePaths(html, s3BaseUrl, yyyy, mm, ddMsg);
  console.log(chalk.green('✓ 画像パス置換'));

  // 4. テストメール送信
  console.log(chalk.cyan('テストメールを送信中...'));
  const sendResult = await sendTestEmail(html, config.subject, reviewerEmail || '', testSegmentId);

  if (!sendResult.success) {
    errors.push({
      type: 'テストメール送信',
      message: 'テストメール送信に失敗しました',
      details: sendResult.error,
    });
    hasError = true;
  }

  if (hasError) {
    console.log(chalk.red.bold('\n✗ テストメール送信でエラーが発生しました\n'));
    errors.forEach(({ type, message, details }) => {
      console.log(chalk.red(`タイプ: ${type}`));
      console.log(chalk.red(`メッセージ: ${message}`));
      if (details) {
        console.log(chalk.red(`詳細: ${details}`));
      }
      console.log();
    });
    process.exit(1);
  }

  console.log(chalk.green('✓ テストメール送信'));
  console.log(chalk.gray(`  送信ID: ${sendResult.id}`));

  if (testSegmentId) {
    console.log(chalk.gray(`  送信方法: Segment一斉送信`));
    console.log(chalk.gray(`  Test Segment ID: ${testSegmentId}`));
  } else {
    console.log(chalk.gray(`  送信方法: 個別送信`));
    console.log(chalk.gray(`  送信先: ${reviewerEmail}`));
  }

  console.log(chalk.gray(`  件名: [TEST] ${config.subject}`));

  console.log(chalk.green.bold('\n✓ テストメール送信が完了しました\n'));
  process.exit(0);
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
