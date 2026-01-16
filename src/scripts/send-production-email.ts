#!/usr/bin/env node

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { render } from '@react-email/render';
import { resend } from '../lib/resend';
import { validateConfig, type Config } from '../lib/config-schema';
import { getLatestArchiveFromS3 } from '../lib/s3';

/**
 * GitHub Actions Production Workflow用本番配信スクリプト
 *
 * 新規追加されたarchiveディレクトリを検出し、以下を実行:
 * 1. React → HTML変換
 * 2. 画像パス置換（/mail-assets/ → S3 URL）
 * 3. Resend APIで本番配信（Audience一斉送信）
 * 4. config.json の sentAt を更新してコミット
 */

const PROJECT_ROOT = path.resolve(__dirname, '../..');

interface ProductionEmailError {
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
    const commitMessage = execSync('git log -1 --format=%s', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();

    console.log(chalk.cyan(`最新コミット: ${commitMessage}`));

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
 * React コンポーネントをHTML に変換
 */
async function renderMailComponent(
  mailPath: string
): Promise<{ html: string } | { error: string }> {
  if (!fs.existsSync(mailPath)) {
    return {
      error: `mail.tsx が見つかりません: ${mailPath}`,
    };
  }

  try {
    // 動的インポート（pathToFileURL でクロスプラットフォーム対応）
    const moduleUrl = pathToFileURL(mailPath).href;
    const module = await import(moduleUrl);
    const Component = module.default;

    // コンポーネントの型チェック
    if (typeof Component !== 'function') {
      throw new Error('Default export is not a React component');
    }

    // React → HTML 変換
    const html = await render(Component(), { plainText: false });

    return { html };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'React コンポーネントのレンダリングに失敗しました',
    };
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
  // <Img> と <img> の両方に対応（大文字小文字不問）
  const pattern = /<[Ii]mg[^>]*src=['"]\/mail-assets\/([^'"]+)['"]/g;

  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(/\/mail-assets\/[^'"]+/, s3Url);
  });
}

/**
 * config.json を読み込み・検証
 */
async function loadConfig(
  archiveDir: string
): Promise<Config | { error: string }> {
  const configPath = path.join(PROJECT_ROOT, archiveDir, 'config.json');

  if (!fs.existsSync(configPath)) {
    return {
      error: `config.json が見つかりません: ${configPath}`,
    };
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
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
 * Resend API で本番配信（Segment一斉送信）
 */
async function sendProductionEmail(
  html: string,
  subject: string,
  segmentId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    // Step 1: Broadcast を作成
    const { data: createData, error: createError } = await resend.broadcasts.create({
      name: `Broadcast - ${subject}`,
      segmentId: segmentId,
      from: fromEmail,
      subject: subject,
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
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '本番メール配信に失敗しました',
    };
  }
}

/**
 * config.json の sentAt を更新
 */
function updateConfigSentAt(archiveDir: string): void {
  const configPath = path.join(PROJECT_ROOT, archiveDir, 'config.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);

  // 現在日時（ISO 8601形式）を設定
  config.sentAt = new Date().toISOString();

  // config.json を更新
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

  console.log(chalk.gray(`  sentAt を更新: ${config.sentAt}`));
}

/**
 * config.json の更新を Git commit & push
 * 注: production.ymlで一括処理するため、この関数は使用しない
 */
// function commitAndPushConfig(archiveDir: string, ddMsg: string): void {
//   try {
//     const configPath = path.join(archiveDir, 'config.json');
//
//     // git add
//     execSync(`git add "${configPath}"`, {
//       cwd: PROJECT_ROOT,
//       stdio: 'inherit',
//     });
//
//     // git commit
//     const commitMsg = `MAIL: Update sentAt for ${ddMsg}`;
//     execSync(`git commit -m "${commitMsg}"`, {
//       cwd: PROJECT_ROOT,
//       stdio: 'inherit',
//     });
//
//     // git push
//     execSync('git push', {
//       cwd: PROJECT_ROOT,
//       stdio: 'inherit',
//     });
//
//     console.log(chalk.gray('  Git commit & push 完了'));
//   } catch (error) {
//     console.error(chalk.yellow('  警告: Git操作に失敗しました'));
//     console.error(error);
//   }
// }

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  本番配信'));
  console.log(chalk.blue.bold('========================================\n'));

  // 環境変数チェック
  if (!process.env.S3_BUCKET_URL) {
    console.error(
      chalk.red('エラー: S3_BUCKET_URL 環境変数が設定されていません')
    );
    process.exit(1);
  }

  // 末尾スラッシュを削除して正規化
  const s3BaseUrl = (process.env.S3_BUCKET_URL || '').replace(/\/$/, '');

  // 最新コミットから対象archiveを特定（send-test-email.ts と同じロジック）
  const directoryName = getTargetArchiveFromCommit();

  let archiveMetadata: ArchiveMetadata | null = null;

  if (directoryName) {
    console.log(chalk.cyan('検出方法: Gitコミットメッセージ'));
    console.log(chalk.cyan('S3でディレクトリ名を検索中...\n'));

    archiveMetadata = await getTargetArchiveFromS3(directoryName);

    if (!archiveMetadata) {
      console.log(chalk.red(`エラー: "${directoryName}" に一致するアーカイブが見つかりませんでした`));
      console.log(chalk.green('✓ 本番配信完了（対象なし）\n'));
      process.exit(0);
    }
  } else {
    console.log(chalk.yellow('Gitコミットから検出できませんでした'));
    console.log(chalk.cyan('S3から最新アーカイブを取得中...\n'));

    archiveMetadata = await getTargetArchiveFromS3();

    if (!archiveMetadata) {
      console.log(chalk.yellow('S3からもアーカイブを取得できませんでした'));
      console.log(chalk.green('✓ 本番配信完了（対象なし）\n'));
      process.exit(0);
    }
  }

  const { yyyy, mm, ddMsg } = archiveMetadata;
  const archivePath = `archives/${yyyy}/${mm}/${ddMsg}`;
  const archiveDir = `src/${archivePath}`;

  console.log(chalk.cyan(`対象アーカイブ: ${archivePath}\n`));

  let hasError = false;
  const errors: ProductionEmailError[] = [];

  // 1. React → HTML 変換
  console.log(chalk.cyan('React → HTML 変換中...'));
  const mailPath = path.join(PROJECT_ROOT, archiveDir, 'mail.tsx');
  const renderResult = await renderMailComponent(mailPath);

  if ('error' in renderResult) {
    errors.push({
      type: 'レンダリング',
      message: 'React コンポーネントのレンダリングに失敗しました',
      details: renderResult.error,
    });
    hasError = true;
  }

  if (hasError) {
    console.log(chalk.red.bold('\n✗ 本番配信でエラーが発生しました\n'));
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

  let html = (renderResult as { html: string }).html;
  console.log(chalk.green('✓ React → HTML 変換'));

  // 2. 画像パス置換
  html = replaceImagePaths(html, s3BaseUrl, yyyy, mm, ddMsg);
  console.log(chalk.green('✓ 画像パス置換'));

  // 3. config.json 読み込み
  console.log(chalk.cyan('config.jsonを取得中...'));
  const configResult = await loadConfig(archiveDir);

  if ('error' in configResult) {
    errors.push({
      type: 'config.json',
      message: 'config.json の読み込みに失敗しました',
      details: configResult.error,
    });
    hasError = true;
  }

  if (hasError) {
    console.log(chalk.red.bold('\n✗ 本番配信でエラーが発生しました\n'));
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

  // 4. 本番配信
  console.log(chalk.cyan('本番メールを送信中...'));
  const sendResult = await sendProductionEmail(
    html,
    config.subject,
    config.segmentId || config.audienceId!
  );

  if (!sendResult.success) {
    errors.push({
      type: '本番配信',
      message: '本番メール配信に失敗しました',
      details: sendResult.error,
    });
    hasError = true;
  }

  if (hasError) {
    console.log(chalk.red.bold('\n✗ 本番配信でエラーが発生しました\n'));
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

  console.log(chalk.green('✓ 本番メール配信'));
  console.log(chalk.gray(`  送信ID: ${sendResult.id}`));
  console.log(chalk.gray(`  Segment ID: ${config.segmentId || config.audienceId}`));
  console.log(chalk.gray(`  件名: ${config.subject}`));

  // 5. config.json の sentAt を更新
  updateConfigSentAt(archiveDir);
  console.log(chalk.green('✓ sentAt 更新'));

  console.log(chalk.green.bold('\n✓ 本番メール配信が完了しました\n'));
  process.exit(0);
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
