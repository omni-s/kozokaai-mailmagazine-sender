#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { render } from '@react-email/render';
import { resend } from '../lib/resend';
import { validateConfig, type Config } from '../lib/config-schema';

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
 * 新規archiveディレクトリを検出
 */
function detectNewArchiveDirectories(): string[] {
  try {
    // git diff で前回のコミットとの差分を取得（ステータス付き）
    const diff = execSync('git diff --name-status HEAD^ HEAD', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });

    const changedLines = diff.split('\n').filter(Boolean);

    // 削除操作（D）を除外し、追加/変更されたファイルのみを抽出
    const changedFiles: string[] = [];
    changedLines.forEach((line) => {
      // フォーマット: "A\tpublic/archives/2025/01/05-test/mail.tsx"
      // または: "M\tpublic/archives/2025/01/05-test/config.json"
      // または: "D\tpublic/archives/2024/12/25-old/mail.tsx" (これを除外)
      const parts = line.split('\t');
      if (parts.length < 2) return;

      const status = parts[0];
      const file = parts[1];

      // 削除操作（D）は除外
      if (status.startsWith('D')) {
        return;
      }

      changedFiles.push(file);
    });

    // public/archives/ 配下のディレクトリを抽出
    const archiveDirs = new Set<string>();
    changedFiles.forEach((file) => {
      if (file.startsWith('public/archives/')) {
        // public/archives/2024/05/20-summer-sale/mail.tsx
        // → public/archives/2024/05/20-summer-sale
        const parts = file.split('/');
        if (parts.length >= 5) {
          const archiveDir = parts.slice(0, 5).join('/');
          archiveDirs.add(archiveDir);
        }
      }
    });

    return Array.from(archiveDirs);
  } catch (error) {
    console.error(chalk.red('エラー: git diff の実行に失敗しました'));
    console.error(error);
    return [];
  }
}

/**
 * アーカイブディレクトリパスからメタデータを抽出
 */
function extractArchiveMetadata(
  archiveDir: string
): ArchiveMetadata | null {
  const match = archiveDir.match(/archives\/(\d{4})\/(\d{2})\/([\w-]+)$/);
  if (!match) {
    return null;
  }
  const [, yyyy, mm, ddMsg] = match;
  return { yyyy, mm, ddMsg };
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
  const pattern = /<Img[^>]*src=['"]\/mail-assets\/([^'"]+)['"]/g;

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
 */
function commitAndPushConfig(archiveDir: string, ddMsg: string): void {
  try {
    const configPath = path.join(archiveDir, 'config.json');

    // git add
    execSync(`git add "${configPath}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });

    // git commit
    const commitMsg = `MAIL: Update sentAt for ${ddMsg}`;
    execSync(`git commit -m "${commitMsg}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });

    // git push
    execSync('git push', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });

    console.log(chalk.gray('  Git commit & push 完了'));
  } catch (error) {
    console.error(chalk.yellow('  警告: Git操作に失敗しました'));
    console.error(error);
  }
}

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

  const s3BaseUrl = process.env.S3_BUCKET_URL;

  // 新規archiveディレクトリを検出
  const archiveDirs = detectNewArchiveDirectories();

  if (archiveDirs.length === 0) {
    console.log(
      chalk.yellow('新規archiveディレクトリが見つかりませんでした')
    );
    console.log(chalk.green('✓ 本番配信完了（対象なし）\n'));
    process.exit(0);
  }

  console.log(chalk.cyan(`検出されたarchiveディレクトリ: ${archiveDirs.length}件\n`));

  let hasError = false;
  const errors: Array<{ dir: string; error: ProductionEmailError }> = [];

  // 各archiveディレクトリを処理
  for (const archiveDir of archiveDirs) {
    console.log(chalk.cyan(`処理中: ${archiveDir}`));

    // 1. アーカイブメタデータ抽出
    const metadata = extractArchiveMetadata(archiveDir);
    if (!metadata) {
      errors.push({
        dir: archiveDir,
        error: {
          type: 'パス',
          message: 'アーカイブディレクトリパスが不正です',
        },
      });
      hasError = true;
      continue;
    }

    const { yyyy, mm, ddMsg } = metadata;

    // 2. React → HTML 変換
    const mailPath = path.join(PROJECT_ROOT, archiveDir, 'mail.tsx');
    const renderResult = await renderMailComponent(mailPath);

    if ('error' in renderResult) {
      errors.push({
        dir: archiveDir,
        error: {
          type: 'レンダリング',
          message: 'React コンポーネントのレンダリングに失敗しました',
          details: renderResult.error,
        },
      });
      hasError = true;
      continue;
    }

    console.log(chalk.green('  ✓ React → HTML 変換'));

    // 3. 画像パス置換
    let html = renderResult.html;
    html = replaceImagePaths(html, s3BaseUrl, yyyy, mm, ddMsg);
    console.log(chalk.green('  ✓ 画像パス置換'));

    // 4. config.json 読み込み
    const configResult = await loadConfig(archiveDir);

    if ('error' in configResult) {
      errors.push({
        dir: archiveDir,
        error: {
          type: 'config.json',
          message: 'config.json の読み込みに失敗しました',
          details: configResult.error,
        },
      });
      hasError = true;
      continue;
    }

    const config = configResult;
    console.log(chalk.green('  ✓ config.json 読み込み'));

    // 5. 本番配信
    const sendResult = await sendProductionEmail(
      html,
      config.subject,
      config.segmentId || config.audienceId!
    );

    if (!sendResult.success) {
      errors.push({
        dir: archiveDir,
        error: {
          type: '本番配信',
          message: '本番メール配信に失敗しました',
          details: sendResult.error,
        },
      });
      hasError = true;
      continue;
    }

    console.log(chalk.green('  ✓ 本番メール配信'));
    console.log(chalk.gray(`    送信ID: ${sendResult.id}`));
    console.log(chalk.gray(`    Segment ID: ${config.segmentId || config.audienceId}`));
    console.log(chalk.gray(`    件名: ${config.subject}`));

    // 6. config.json の sentAt を更新
    updateConfigSentAt(archiveDir);
    console.log(chalk.green('  ✓ sentAt 更新'));

    // 7. Git commit & push
    commitAndPushConfig(archiveDir, ddMsg);
    console.log(chalk.green('  ✓ Git commit & push'));

    console.log();
  }

  // 結果表示
  if (hasError) {
    console.log(chalk.red.bold('\n✗ 本番配信でエラーが発生しました\n'));
    errors.forEach(({ dir, error }) => {
      console.log(chalk.red(`[${dir}]`));
      console.log(chalk.red(`  タイプ: ${error.type}`));
      console.log(chalk.red(`  メッセージ: ${error.message}`));
      if (error.details) {
        console.log(chalk.red(`  詳細: ${error.details}`));
      }
      console.log();
    });
    process.exit(1);
  } else {
    console.log(chalk.green.bold('✓ すべての本番メール配信に成功しました\n'));
    process.exit(0);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
