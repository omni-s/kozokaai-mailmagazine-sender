#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

/**
 * pnpm run reset-draft スクリプト
 *
 * page.tsx を初期テンプレート（template.txt）からリセット
 */

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DRAFT_FILE = path.join(PROJECT_ROOT, "src/app/page.tsx");
const TEMPLATE_FILE = path.join(PROJECT_ROOT, "src/app/draft/template.txt");

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold("\n========================================"));
  console.log(chalk.blue.bold("  Resend メール配信システム"));
  console.log(chalk.blue.bold("  page.tsx リセットツール"));
  console.log(chalk.blue.bold("========================================\n"));

  // 1. template.txt 存在チェック
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(chalk.red("エラー: src/app/draft/template.txt が見つかりません"));
    console.error(
      chalk.yellow("ヒント: 初期テンプレートファイルを作成してください")
    );
    process.exit(1);
  }

  // 2. page.tsx 存在チェック
  if (!fs.existsSync(DRAFT_FILE)) {
    console.error(chalk.red("エラー: src/app/page.tsx が見つかりません"));
    process.exit(1);
  }

  // 3. page.tsx をリセット
  console.log(chalk.cyan("page.tsx を初期テンプレート（template.txt）からリセット中..."));
  fs.copyFileSync(TEMPLATE_FILE, DRAFT_FILE);

  console.log(chalk.green("✓ page.tsx リセット完了\n"));
  console.log(chalk.blue("次のステップ:"));
  console.log(chalk.blue("  1. http://localhost:3000 でメールをデザイン"));
  console.log(chalk.blue("  2. 完成したら pnpm run commit でアーカイブ作成\n"));
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red("エラーが発生しました:"), error);
  process.exit(1);
});
