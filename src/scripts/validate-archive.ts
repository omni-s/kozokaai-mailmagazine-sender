#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { validateConfig } from '../lib/config-schema';
import { checkSegmentExists } from '../lib/resend';

/**
 * GitHub Actions Check Workflow用バリデーションスクリプト
 *
 * 新規追加されたarchiveディレクトリを検出し、以下を検証:
 * 1. config.json のスキーマ検証
 * 2. 画像パスの実在チェック
 * 3. Resend Audience ID存在確認
 */

const PROJECT_ROOT = path.resolve(__dirname, '../..');

interface ValidationError {
  type: string;
  message: string;
  details?: string;
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
 * config.json の検証
 */
async function validateConfigJson(
  archiveDir: string
): Promise<ValidationError | null> {
  const configPath = path.join(PROJECT_ROOT, archiveDir, 'config.json');

  // ファイル存在チェック
  if (!fs.existsSync(configPath)) {
    return {
      type: 'config.json',
      message: 'config.json が見つかりません',
      details: configPath,
    };
  }

  // JSON読み込み
  let configData: unknown;
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    configData = JSON.parse(configContent);
  } catch (error) {
    return {
      type: 'config.json',
      message: 'config.json のパースに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Zodスキーマでバリデーション
  const result = validateConfig(configData);
  if (!result.success) {
    const errorMessages = result.error?.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return {
      type: 'config.json',
      message: 'config.json のバリデーションに失敗しました',
      details: errorMessages,
    };
  }

  return null;
}

/**
 * TypeScript/JSXコメントを除去
 * - 複数行コメント (slash-asterisk から asterisk-slash)
 * - 単一行コメント (double-slash)
 */
function removeComments(code: string): string {
  // 複数行コメント /\* ... *\/ を除去
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // 単一行コメント // ... を除去
  code = code.replace(/\/\/.*$/gm, '');

  return code;
}

/**
 * 画像パスの検証
 */
function validateImagePaths(archiveDir: string): ValidationError | null {
  const mailPath = path.join(PROJECT_ROOT, archiveDir, 'mail.tsx');
  const assetsDir = path.join(PROJECT_ROOT, archiveDir, 'assets');

  // mail.tsx 存在チェック
  if (!fs.existsSync(mailPath)) {
    return {
      type: 'mail.tsx',
      message: 'mail.tsx が見つかりません',
      details: mailPath,
    };
  }

  // mail.tsx を読み込み
  let mailContent = fs.readFileSync(mailPath, 'utf-8');

  // コメントを除去してからパターンマッチング
  mailContent = removeComments(mailContent);

  // <Img src="/mail-assets/..." /> のパターンを抽出
  const imgPattern = /<Img[^>]*src=["']\/mail-assets\/([^"']+)["']/g;
  const matches = [...mailContent.matchAll(imgPattern)];

  if (matches.length === 0) {
    // 画像が使用されていない場合は警告のみ
    console.log(chalk.yellow('  警告: 画像が使用されていません'));
    return null;
  }

  // 各画像ファイルの存在確認
  const missingImages: string[] = [];
  matches.forEach((match) => {
    const filename = match[1];
    const imagePath = path.join(assetsDir, filename);
    if (!fs.existsSync(imagePath)) {
      missingImages.push(filename);
    }
  });

  if (missingImages.length > 0) {
    return {
      type: '画像パス',
      message: '参照されている画像が見つかりません',
      details: missingImages.join(', '),
    };
  }

  return null;
}

/**
 * Resend Segment ID の検証
 */
async function validateSegmentId(
  archiveDir: string
): Promise<ValidationError | null> {
  const configPath = path.join(PROJECT_ROOT, archiveDir, 'config.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);

  const segmentId = config.segmentId || config.audienceId;
  if (!segmentId) {
    return {
      type: 'Segment ID',
      message: 'config.json に segmentId または audienceId が設定されていません',
    };
  }

  // Resend API で Segment存在確認
  const exists = await checkSegmentExists(segmentId);
  if (!exists) {
    return {
      type: 'Segment ID',
      message: 'Resend Segment が見つかりません',
      details: `Segment ID: ${segmentId}`,
    };
  }

  return null;
}

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  アーカイブ バリデーション'));
  console.log(chalk.blue.bold('========================================\n'));

  // 新規archiveディレクトリを検出
  const archiveDirs = detectNewArchiveDirectories();

  if (archiveDirs.length === 0) {
    console.log(
      chalk.yellow('新規archiveディレクトリが見つかりませんでした')
    );
    console.log(chalk.green('✓ バリデーション完了（検証対象なし）\n'));
    process.exit(0);
  }

  console.log(chalk.cyan(`検出されたarchiveディレクトリ: ${archiveDirs.length}件\n`));

  let hasError = false;
  const errors: Array<{ dir: string; error: ValidationError }> = [];

  // 各archiveディレクトリを検証
  for (const archiveDir of archiveDirs) {
    console.log(chalk.cyan(`検証中: ${archiveDir}`));

    // 1. config.json 検証
    const configError = await validateConfigJson(archiveDir);
    if (configError) {
      errors.push({ dir: archiveDir, error: configError });
      hasError = true;
      continue;
    }
    console.log(chalk.green('  ✓ config.json'));

    // 2. 画像パス検証
    const imageError = validateImagePaths(archiveDir);
    if (imageError) {
      errors.push({ dir: archiveDir, error: imageError });
      hasError = true;
      continue;
    }
    console.log(chalk.green('  ✓ 画像パス'));

    // 3. Resend Segment ID検証
    const segmentError = await validateSegmentId(archiveDir);
    if (segmentError) {
      errors.push({ dir: archiveDir, error: segmentError });
      hasError = true;
      continue;
    }
    console.log(chalk.green('  ✓ Resend Segment ID'));

    console.log();
  }

  // 結果表示
  if (hasError) {
    console.log(chalk.red.bold('\n✗ バリデーションエラーが発生しました\n'));
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
    console.log(chalk.green.bold('✓ すべてのバリデーションに合格しました\n'));
    process.exit(0);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
