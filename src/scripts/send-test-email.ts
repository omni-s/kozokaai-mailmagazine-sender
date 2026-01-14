#!/usr/bin/env node

import 'dotenv/config';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { resend } from '../lib/resend';
import { validateConfig, type Config } from '../lib/config-schema';
import { format } from 'date-fns';

/**
 * GitHub Actions Staging Workflow用テストメール送信スクリプト
 *
 * 最新コミットのメッセージから対象archiveを特定し、以下を実行:
 * 1. S3からmail.htmlとconfig.jsonを取得
 * 2. 画像パス置換（/mail-assets/ → S3 URL）
 * 3. Resend APIでテストメール送信
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
 */
function getTargetArchiveFromCommit(): string | null {
  try {
    // 最新コミットメッセージを取得
    const commitMessage = execSync('git log -1 --format=%s', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();

    console.log(chalk.cyan(`最新コミット: ${commitMessage}`));

    // "MAIL: {directory-name}" 形式からディレクトリ名を抽出
    const match = commitMessage.match(/^MAIL:\s*(.+)$/);
    if (!match) {
      return null;
    }

    const directoryName = match[1].trim();
    console.log(chalk.cyan(`検出されたディレクトリ名: ${directoryName}`));

    return directoryName;
  } catch (error) {
    console.error(chalk.red('エラー: git log の実行に失敗しました'));
    console.error(error);
    return null;
  }
}

/**
 * ディレクトリ名から完全なアーカイブパスを構築
 */
function buildArchivePath(directoryName: string): ArchiveMetadata {
  // 現在の日付を取得
  const now = new Date();
  const yyyy = format(now, 'yyyy');
  const mm = format(now, 'MM');

  // directoryNameが既に "DD-message" 形式の場合はそのまま使用
  // そうでない場合は、今日の日付を使用
  let ddMsg = directoryName;
  if (!/^\d{2}-/.test(directoryName)) {
    const dd = format(now, 'dd');
    ddMsg = `${dd}-${directoryName}`;
  }

  return { yyyy, mm, ddMsg };
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
 * 画像パスを /mail-assets/ から S3 URL に置換
 */
function replaceImagePaths(
  html: string,
  s3BaseUrl: string,
  yyyy: string,
  mm: string,
  ddMsg: string
): string {
  const pattern = /<[Ii]mg[^>]*src=['"]\/mail-assets\/([^'"]+)['"]/g;

  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(/\/mail-assets\/[^'"]+/, s3Url);
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
 */
async function sendTestEmail(
  html: string,
  subject: string,
  recipientEmail: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
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

  if (!process.env.REVIEWER_EMAIL) {
    console.error(
      chalk.red('エラー: REVIEWER_EMAIL 環境変数が設定されていません')
    );
    process.exit(1);
  }

  // 末尾スラッシュを削除して正規化
  const s3BaseUrl = (process.env.S3_BUCKET_URL || '').replace(/\/$/, '');
  const reviewerEmail = process.env.REVIEWER_EMAIL;

  // 最新コミットから対象archiveを特定
  const directoryName = getTargetArchiveFromCommit();

  if (!directoryName) {
    console.log(
      chalk.yellow('コミットメッセージから対象archiveが見つかりませんでした')
    );
    console.log(chalk.green('✓ テストメール送信完了（対象なし）\n'));
    process.exit(0);
  }

  // アーカイブパスを構築
  const { yyyy, mm, ddMsg } = buildArchivePath(directoryName);
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
  const sendResult = await sendTestEmail(html, config.subject, reviewerEmail);

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
  console.log(chalk.gray(`  送信先: ${reviewerEmail}`));
  console.log(chalk.gray(`  件名: [TEST] ${config.subject}`));

  console.log(chalk.green.bold('\n✓ テストメール送信が完了しました\n'));
  process.exit(0);
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
