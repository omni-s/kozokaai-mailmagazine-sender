#!/usr/bin/env node

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { uploadDirectoryToS3, uploadArchiveMetadataToS3 } from '../lib/s3';

/**
 * GitHub Actions Staging Workflow用S3アップロードスクリプト
 *
 * 新規追加されたarchiveディレクトリを検出し、assets/配下の画像をS3へアップロード
 */

const PROJECT_ROOT = path.resolve(__dirname, '../..');

interface UploadError {
  dir: string;
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
      // フォーマット: "A\tsrc/archives/2025/01/05-test/mail.tsx"
      // または: "M\tsrc/archives/2025/01/05-test/config.json"
      // または: "D\tsrc/archives/2024/12/25-old/mail.tsx" (これを除外)
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

    // src/archives/ 配下のディレクトリを抽出
    const archiveDirs = new Set<string>();
    changedFiles.forEach((file) => {
      if (file.startsWith('src/archives/')) {
        // src/archives/2024/05/20-summer-sale/mail.tsx
        // → src/archives/2024/05/20-summer-sale
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
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  S3 アップロード'));
  console.log(chalk.blue.bold('========================================\n'));

  // 新規archiveディレクトリを検出
  const archiveDirs = detectNewArchiveDirectories();

  if (archiveDirs.length === 0) {
    console.log(
      chalk.yellow('新規archiveディレクトリが見つかりませんでした')
    );
    console.log(chalk.green('✓ アップロード完了（対象なし）\n'));
    process.exit(0);
  }

  console.log(chalk.cyan(`検出されたarchiveディレクトリ: ${archiveDirs.length}件\n`));

  let hasError = false;
  const errors: UploadError[] = [];

  // 各archiveディレクトリの画像をアップロード
  for (const archiveDir of archiveDirs) {
    console.log(chalk.cyan(`アップロード中: ${archiveDir}`));

    // assetsディレクトリのパス
    const assetsDir = path.join(PROJECT_ROOT, archiveDir, 'assets');

    // assetsディレクトリの存在確認
    if (!fs.existsSync(assetsDir)) {
      console.log(chalk.yellow('  警告: assetsディレクトリが存在しません'));
      console.log();
      continue;
    }

    // S3プレフィックスを構築
    // src/archives/2024/05/20-summer-sale → archives/2024/05/20-summer-sale/assets
    const s3Prefix = archiveDir.replace('src/', '') + '/assets';

    try {
      // 画像をS3にアップロード
      console.log(chalk.cyan('  画像をS3にアップロード中...'));
      const imageResults = await uploadDirectoryToS3(assetsDir, s3Prefix);

      // メタデータをS3にアップロード
      console.log(chalk.cyan('  メタデータ（mail.tsx, config.json）をS3にアップロード中...'));
      const metadataResults = await uploadArchiveMetadataToS3(
        path.join(PROJECT_ROOT, archiveDir),
        archiveDir.replace('src/', '')
      );

      // 結果を統合
      const results = [...imageResults, ...metadataResults];

      if (results.length === 0) {
        console.log(chalk.yellow('  警告: アップロード対象のファイルがありません'));
        console.log();
        continue;
      }

      // 結果を表示
      let uploadSuccess = 0;
      let uploadFailed = 0;

      results.forEach((result) => {
        if (result.success) {
          console.log(chalk.green(`  ✓ ${result.file}`));
          uploadSuccess++;
        } else {
          console.log(chalk.red(`  ✗ ${result.file}: ${result.error}`));
          uploadFailed++;
          hasError = true;
          errors.push({
            dir: archiveDir,
            message: `ファイルアップロード失敗: ${result.file}`,
            details: result.error,
          });
        }
      });

      console.log(
        chalk.cyan(
          `  完了: ${uploadSuccess}件成功, ${uploadFailed}件失敗`
        )
      );
      console.log();
    } catch (error) {
      console.error(chalk.red(`  エラー: アップロード処理に失敗しました`));
      console.error(error);
      hasError = true;
      errors.push({
        dir: archiveDir,
        message: 'アップロード処理に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
      console.log();
    }
  }

  // 結果表示
  if (hasError) {
    console.log(chalk.red.bold('\n✗ S3アップロードでエラーが発生しました\n'));
    errors.forEach(({ dir, message, details }) => {
      console.log(chalk.red(`[${dir}]`));
      console.log(chalk.red(`  メッセージ: ${message}`));
      if (details) {
        console.log(chalk.red(`  詳細: ${details}`));
      }
      console.log();
    });
    process.exit(1);
  } else {
    console.log(chalk.green.bold('✓ すべてのファイルのアップロードに成功しました\n'));
    process.exit(0);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
