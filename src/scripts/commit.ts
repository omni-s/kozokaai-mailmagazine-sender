#!/usr/bin/env node

import inquirer from 'inquirer';
import { format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * pnpm run commit メインスクリプト
 *
 * ローカル制作完了後の自動アーカイブ・コミット処理
 */

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DRAFT_FILE = path.join(PROJECT_ROOT, 'src/app/draft/page.tsx');
const TEMPLATE_FILE = path.join(PROJECT_ROOT, 'src/app/draft/template.tsx');
const MAIL_ASSETS_DIR = path.join(PROJECT_ROOT, 'public/mail-assets');
const ARCHIVES_DIR = path.join(PROJECT_ROOT, 'public/archives');

interface CommitAnswers {
  commitMessage: string;
  subject: string;
  audienceId: string;
}

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  アーカイブ & コミットツール'));
  console.log(chalk.blue.bold('========================================\n'));

  // 1. draft/page.tsx が存在するか確認
  if (!fs.existsSync(DRAFT_FILE)) {
    console.error(chalk.red('エラー: src/app/draft/page.tsx が見つかりません'));
    process.exit(1);
  }

  // 2. template.tsx が存在するか確認
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(
      chalk.red('エラー: src/app/draft/template.tsx が見つかりません')
    );
    console.error(
      chalk.yellow('ヒント: 初期テンプレートファイルを作成してください')
    );
    process.exit(1);
  }

  // 3. 対話型入力
  const answers = await inquirer.prompt<CommitAnswers>([
    {
      type: 'input',
      name: 'commitMessage',
      message: 'コミットメッセージ（ディレクトリ名に使用）:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'コミットメッセージは必須です';
        }
        // ディレクトリ名に使用できない文字をチェック
        if (/[\/\\:*?"<>|]/.test(input)) {
          return 'ディレクトリ名に使用できない文字が含まれています';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'subject',
      message: 'メール件名:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'メール件名は必須です';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'audienceId',
      message: 'Resend Audience ID (例: aud_12345678):',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Audience IDは必須です';
        }
        if (!/^aud_[a-zA-Z0-9]+$/.test(input)) {
          return 'Audience IDの形式が不正です（例: aud_12345678）';
        }
        return true;
      },
    },
  ]);

  // 4. 日付取得
  const now = new Date();
  const year = format(now, 'yyyy');
  const month = format(now, 'MM');
  const day = format(now, 'dd');
  const dirName = `${day}-${answers.commitMessage}`;

  // 5. アーカイブディレクトリパス
  const archiveDir = path.join(ARCHIVES_DIR, year, month, dirName);
  const assetsDir = path.join(archiveDir, 'assets');

  console.log(chalk.cyan(`\nアーカイブディレクトリ: ${archiveDir}`));

  // 6. ディレクトリ作成
  if (fs.existsSync(archiveDir)) {
    console.error(
      chalk.red(`\nエラー: アーカイブディレクトリが既に存在します: ${archiveDir}`)
    );
    console.error(
      chalk.yellow('ヒント: 異なるコミットメッセージを使用してください')
    );
    process.exit(1);
  }

  console.log(chalk.cyan('アーカイブディレクトリを作成中...'));
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  // 7. draft/page.tsx を mail.tsx へ移動
  const mailFile = path.join(archiveDir, 'mail.tsx');
  console.log(chalk.cyan('draft/page.tsx を mail.tsx へ移動中...'));
  fs.copyFileSync(DRAFT_FILE, mailFile);

  // 8. mail-assets/ の画像を assets/ へ移動
  if (fs.existsSync(MAIL_ASSETS_DIR)) {
    const files = fs.readdirSync(MAIL_ASSETS_DIR);
    if (files.length > 0) {
      console.log(chalk.cyan(`画像ファイルを移動中... (${files.length}件)`));
      files.forEach((file) => {
        const srcPath = path.join(MAIL_ASSETS_DIR, file);
        const destPath = path.join(assetsDir, file);
        fs.copyFileSync(srcPath, destPath);
        fs.unlinkSync(srcPath); // 元ファイルを削除
      });
    } else {
      console.log(chalk.yellow('警告: mail-assets/ に画像がありません'));
    }
  }

  // 9. config.json 生成
  const configFile = path.join(archiveDir, 'config.json');
  const config = {
    subject: answers.subject,
    audienceId: answers.audienceId,
    sentAt: null,
  };

  console.log(chalk.cyan('config.json を生成中...'));
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');

  // 10. draft/page.tsx を初期テンプレートにリセット
  console.log(chalk.cyan('draft/page.tsx を初期テンプレートにリセット中...'));
  fs.copyFileSync(TEMPLATE_FILE, DRAFT_FILE);

  // 11. Git操作
  console.log(chalk.cyan('\nGit操作を実行中...'));

  try {
    // git add .
    console.log(chalk.gray('  $ git add .'));
    execSync('git add .', { cwd: PROJECT_ROOT, stdio: 'inherit' });

    // git commit
    const commitMsg = `MAIL: ${answers.commitMessage}`;
    console.log(chalk.gray(`  $ git commit -m "${commitMsg}"`));
    execSync(`git commit -m "${commitMsg}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });

    // git push
    console.log(chalk.gray('  $ git push'));
    execSync('git push', { cwd: PROJECT_ROOT, stdio: 'inherit' });

    console.log(chalk.green.bold('\n✓ アーカイブ & コミットが完了しました！\n'));
    console.log(chalk.blue('次のステップ:'));
    console.log(chalk.blue('  1. PRを作成してレビュー依頼'));
    console.log(chalk.blue('  2. 上長がテストメールを確認'));
    console.log(chalk.blue('  3. 承認後にマージして本番配信\n'));
  } catch (error) {
    console.error(chalk.red('\nエラー: Git操作に失敗しました'));
    console.error(error);
    process.exit(1);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
