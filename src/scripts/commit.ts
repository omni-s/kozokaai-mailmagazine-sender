#!/usr/bin/env node

import inquirer from "inquirer";
import { format } from "date-fns";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import chalk from "chalk";

/**
 * pnpm run commit メインスクリプト
 *
 * ローカル制作完了後の自動アーカイブ・コミット処理
 */

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DRAFT_FILE = path.join(PROJECT_ROOT, "src/app/draft/page.tsx");
const TEMPLATE_FILE = path.join(PROJECT_ROOT, "src/app/draft/template.txt");
const MAIL_ASSETS_DIR = path.join(PROJECT_ROOT, "public/mail-assets");
const ARCHIVES_DIR = path.join(PROJECT_ROOT, "public/archives");

interface CommitAnswers {
  commitMessage: string;
  subject: string;
  segmentId: string;
}

/**
 * Git操作の結果
 */
interface GitOperationResult {
  success: boolean;
  error?: string;
  stderr?: string;
  needsUpstream?: boolean; // push専用
  branch?: string; // push専用
}

/**
 * Gitエラーのカテゴリ
 */
type GitErrorCategory =
  | "auth"
  | "network"
  | "upstream"
  | "conflict"
  | "rejected"
  | "unknown";

/**
 * Gitエラーの詳細情報
 */
interface GitErrorInfo {
  category: GitErrorCategory;
  title: string;
  description: string;
  suggestions: string[];
  commands?: string[];
}

/**
 * ステップの状態
 */
type StepStatus = "pending" | "running" | "success" | "failed";

/**
 * 実行ステップ
 */
interface Step {
  id: string;
  name: string;
  status: StepStatus;
  error?: string;
}

/**
 * 全実行ステップの定義
 */
const STEPS: Step[] = [
  {
    id: "check-files",
    name: "事前チェック（draft/page.tsx, template.txt）",
    status: "pending",
  },
  {
    id: "input",
    name: "ユーザー入力（コミットメッセージ、件名、Segment ID）",
    status: "pending",
  },
  {
    id: "create-dir",
    name: "アーカイブディレクトリ作成",
    status: "pending",
  },
  { id: "move-mail", name: "mail.tsx 移動", status: "pending" },
  { id: "move-assets", name: "画像ファイル移動", status: "pending" },
  { id: "create-config", name: "config.json 生成", status: "pending" },
  {
    id: "reset-draft",
    name: "draft/page.tsx リセット",
    status: "pending",
  },
  { id: "git-add", name: "git add", status: "pending" },
  { id: "git-commit", name: "git commit", status: "pending" },
  { id: "git-push", name: "git push", status: "pending" },
];

/**
 * プログレス状況を表示
 */
function displayProgress(): void {
  console.log(chalk.cyan("\n進捗状況:\n"));

  STEPS.forEach((step) => {
    let symbol = "  ";
    let colorFn = chalk.gray;

    if (step.status === "running") {
      symbol = "○";
      colorFn = chalk.cyan;
    } else if (step.status === "success") {
      symbol = "✓";
      colorFn = chalk.green;
    } else if (step.status === "failed") {
      symbol = "×";
      colorFn = chalk.red;
    }

    console.log(colorFn(`  ${symbol} ${step.name}`));
    if (step.error && step.status === "failed") {
      console.log(chalk.red(`    エラー: ${step.error}`));
    }
  });

  console.log();
}

/**
 * ステップの状態を更新
 */
function updateStepStatus(
  stepId: string,
  status: StepStatus,
  error?: string
): void {
  const step = STEPS.find((s) => s.id === stepId);
  if (step) {
    step.status = status;
    if (error) {
      step.error = error;
    }
  }
}

/**
 * 完了したステップを取得
 */
function getCompletedSteps(): Step[] {
  return STEPS.filter((s) => s.status === "success");
}

/**
 * 失敗したステップを取得
 * 将来のエラー詳細表示機能拡張で使用予定
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFailedStep(): Step | undefined {
  return STEPS.find((s) => s.status === "failed");
}

/**
 * 現在のブランチ名を取得
 */
function getCurrentBranch(): string {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    }).trim();
    return branch;
  } catch {
    return "main"; // フォールバック
  }
}

/**
 * git add を実行
 */
function executeGitAdd(): GitOperationResult {
  try {
    execSync("git add .", {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      encoding: "utf-8",
    });

    return { success: true };
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && "stderr" in error
        ? String(error.stderr)
        : "Unknown error";

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stderr,
    };
  }
}

/**
 * git commit を実行
 */
function executeGitCommit(commitMessage: string): GitOperationResult {
  try {
    execSync(`git commit -m "${commitMessage}"`, {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      encoding: "utf-8",
    });

    return { success: true };
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && "stderr" in error
        ? String(error.stderr)
        : "Unknown error";

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stderr,
    };
  }
}

/**
 * git push を実行
 */
function executeGitPush(): GitOperationResult {
  try {
    execSync("git push", {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      encoding: "utf-8",
    });

    return { success: true };
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && "stderr" in error
        ? String(error.stderr)
        : "Unknown error";

    // upstream エラーを検出
    const upstreamError = detectUpstreamError(stderr);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stderr,
      needsUpstream: upstreamError.needsUpstream,
      branch: upstreamError.branch,
    };
  }
}

/**
 * upstream エラーを検出
 */
function detectUpstreamError(stderr: string): {
  needsUpstream: boolean;
  branch?: string;
} {
  const lowerStderr = stderr.toLowerCase();

  // upstream エラーパターン
  if (
    lowerStderr.includes("no upstream branch") ||
    lowerStderr.includes("set-upstream")
  ) {
    // ブランチ名を抽出
    const branchMatch = stderr.match(/current branch (\S+) has no upstream/i);
    if (branchMatch) {
      return { needsUpstream: true, branch: branchMatch[1] };
    }

    // ブランチ名が取得できない場合は現在のブランチを使用
    return { needsUpstream: true, branch: getCurrentBranch() };
  }

  return { needsUpstream: false };
}

/**
 * git push --set-upstream を実行
 */
function executeGitPushWithUpstream(branch: string): GitOperationResult {
  try {
    execSync(`git push --set-upstream origin ${branch}`, {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      encoding: "utf-8",
    });

    return { success: true };
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && "stderr" in error
        ? String(error.stderr)
        : "Unknown error";

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stderr,
    };
  }
}

/**
 * Gitエラーを分類
 */
function categorizeGitError(
  operation: "add" | "commit" | "push",
  stderr: string
): GitErrorInfo {
  const lowerStderr = stderr.toLowerCase();

  // 認証エラー
  if (
    lowerStderr.includes("authentication") ||
    lowerStderr.includes("permission denied") ||
    lowerStderr.includes("could not read from remote")
  ) {
    return {
      category: "auth",
      title: "認証エラー",
      description:
        "Gitリモートリポジトリへの認証に失敗しました。SSHキーまたはPersonal Access Tokenを確認してください。",
      suggestions: [
        "SSHキーが正しく設定されているか確認してください",
        "Personal Access Tokenが有効か確認してください",
        "GitHubアカウントの認証情報を確認してください",
      ],
      commands: [
        "ssh -T git@github.com  # SSH接続テスト",
        "git config --list  # Git設定確認",
      ],
    };
  }

  // ネットワークエラー
  if (
    lowerStderr.includes("network") ||
    lowerStderr.includes("connection") ||
    lowerStderr.includes("timeout") ||
    lowerStderr.includes("unable to access")
  ) {
    return {
      category: "network",
      title: "ネットワークエラー",
      description:
        "リモートリポジトリへの接続に失敗しました。インターネット接続を確認してください。",
      suggestions: [
        "インターネット接続を確認してください",
        "VPNやプロキシ設定を確認してください",
        "GitHubのステータスページを確認してください: https://www.githubstatus.com/",
      ],
      commands: ["ping github.com  # GitHub接続テスト"],
    };
  }

  // upstream エラー
  if (
    lowerStderr.includes("no upstream") ||
    lowerStderr.includes("set-upstream")
  ) {
    return {
      category: "upstream",
      title: "upstream ブランチ未設定",
      description: "現在のブランチに upstream ブランチが設定されていません。",
      suggestions: [
        "自動的に upstream を設定して再試行します",
        "手動で設定する場合は以下のコマンドを実行してください",
      ],
      commands: [
        `git push --set-upstream origin ${getCurrentBranch()}  # upstream設定`,
      ],
    };
  }

  // コンフリクトエラー
  if (
    lowerStderr.includes("rejected") ||
    lowerStderr.includes("non-fast-forward") ||
    lowerStderr.includes("updates were rejected")
  ) {
    return {
      category: "conflict",
      title: "コンフリクトエラー",
      description:
        "リモートリポジトリに新しいコミットがあり、pushが拒否されました。",
      suggestions: [
        "リモートの変更を取り込んでから再度pushしてください",
        "git pull でリモートの変更を取り込んでください",
        "コンフリクトが発生した場合は解決してください",
      ],
      commands: [
        "git pull --rebase  # リモートの変更を取り込む",
        "git status  # 状態確認",
      ],
    };
  }

  // Push拒否エラー
  if (
    lowerStderr.includes("protected branch") ||
    lowerStderr.includes("required status check")
  ) {
    return {
      category: "rejected",
      title: "Push拒否",
      description:
        "ブランチ保護ルールまたは必須ステータスチェックによりpushが拒否されました。",
      suggestions: [
        "ブランチ保護ルールを確認してください",
        "必須のステータスチェックが通過しているか確認してください",
        "リポジトリの管理者に相談してください",
      ],
      commands: [],
    };
  }

  // 不明なエラー
  return {
    category: "unknown",
    title: "不明なエラー",
    description: `git ${operation} 操作中に不明なエラーが発生しました。`,
    suggestions: [
      "エラーメッセージを確認してください",
      "Git操作を手動で実行して詳細を確認してください",
    ],
    commands: [`git ${operation}  # 手動実行`],
  };
}

/**
 * 詳細なエラー情報を表示
 */
function displayDetailedError(
  operation: "add" | "commit" | "push",
  result: GitOperationResult
): void {
  const errorInfo = categorizeGitError(operation, result.stderr || "");

  console.log(chalk.red("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.red("エラーの詳細"));
  console.log(chalk.red("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  console.log(chalk.red.bold(`種別: ${errorInfo.title}\n`));

  console.log(chalk.red("原因:"));
  console.log(chalk.red(`  ${errorInfo.description}\n`));

  const completedSteps = getCompletedSteps();
  if (completedSteps.length > 0) {
    console.log(chalk.red("完了したステップ:"));
    completedSteps.forEach((step) => {
      if (step.id.startsWith("git-")) {
        console.log(chalk.red(`  ✓ ${step.name}`));
      }
    });
    console.log();
  }

  console.log(chalk.red("推奨される対処法:"));
  errorInfo.suggestions.forEach((suggestion, index) => {
    console.log(chalk.red(`  ${index + 1}. ${suggestion}`));
  });
  console.log();

  if (errorInfo.commands && errorInfo.commands.length > 0) {
    console.log(chalk.red("参考コマンド:"));
    errorInfo.commands.forEach((cmd) => {
      console.log(chalk.red(`  $ ${cmd}`));
    });
    console.log();
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold("\n========================================"));
  console.log(chalk.blue.bold("  Resend メール配信システム"));
  console.log(chalk.blue.bold("  アーカイブ & コミットツール"));
  console.log(chalk.blue.bold("========================================\n"));

  // 1. 事前チェック（draft/page.tsx, template.tsx）
  updateStepStatus("check-files", "running");

  if (!fs.existsSync(DRAFT_FILE)) {
    updateStepStatus(
      "check-files",
      "failed",
      "src/app/draft/page.tsx が見つかりません"
    );
    displayProgress();
    console.error(chalk.red("エラー: src/app/draft/page.tsx が見つかりません"));
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATE_FILE)) {
    updateStepStatus(
      "check-files",
      "failed",
      "src/app/draft/template.txt が見つかりません"
    );
    displayProgress();
    console.error(
      chalk.red("エラー: src/app/draft/template.txt が見つかりません")
    );
    console.error(
      chalk.yellow("ヒント: 初期テンプレートファイルを作成してください")
    );
    process.exit(1);
  }

  updateStepStatus("check-files", "success");
  console.log(chalk.green("✓ 事前チェック（draft/page.tsx, template.txt）"));

  // 2. ユーザー入力
  updateStepStatus("input", "running");

  const answers = await inquirer.prompt<CommitAnswers>([
    {
      type: "input",
      name: "commitMessage",
      message: "コミットメッセージ（ディレクトリ名に使用）:",
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return "コミットメッセージは必須です";
        }
        // ディレクトリ名に使用できない文字をチェック
        if (/[\/\\:*?"<>|]/.test(input)) {
          return "ディレクトリ名に使用できない文字が含まれています";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "subject",
      message: "メール件名:",
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return "メール件名は必須です";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "segmentId",
      message: "Resend Segment ID (例: a355a0bd-32fa-4ef4-b6d5-7341f702d35b):",
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return "Segment IDは必須です";
        }
        // UUID v4 形式
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            input
          )
        ) {
          return "Segment IDの形式が不正です（UUID形式で入力してください）";
        }
        return true;
      },
    },
  ]);

  updateStepStatus("input", "success");
  console.log(
    chalk.green("✓ ユーザー入力（コミットメッセージ、件名、Segment ID）")
  );

  // 3. 日付取得
  const now = new Date();
  const year = format(now, "yyyy");
  const month = format(now, "MM");
  const day = format(now, "dd");
  const dirName = `${day}-${answers.commitMessage}`;

  // 4. アーカイブディレクトリパス
  const archiveDir = path.join(ARCHIVES_DIR, year, month, dirName);
  const assetsDir = path.join(archiveDir, "assets");

  console.log(chalk.cyan(`\nアーカイブディレクトリ: ${archiveDir}`));

  // 5. アーカイブディレクトリ作成
  updateStepStatus("create-dir", "running");

  if (fs.existsSync(archiveDir)) {
    console.log(chalk.yellow(`\n既に存在するディレクトリです: ${archiveDir}`));

    const overwriteAnswer = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: "confirm",
        name: "overwrite",
        message: "上書きしますか？",
        default: false,
      },
    ]);

    if (!overwriteAnswer.overwrite) {
      updateStepStatus("create-dir", "failed", "ユーザーがキャンセルしました");
      displayProgress();
      console.log(chalk.yellow("\n操作がキャンセルされました"));
      process.exit(0);
    }

    // 既存ディレクトリを削除
    console.log(chalk.cyan("既存のディレクトリを削除中..."));
    fs.rmSync(archiveDir, { recursive: true, force: true });
    console.log(chalk.green("✓ 既存のディレクトリを削除しました"));
  }

  console.log(chalk.cyan("アーカイブディレクトリを作成中..."));
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  updateStepStatus("create-dir", "success");
  console.log(chalk.green("✓ アーカイブディレクトリ作成"));

  // 6. mail.tsx 移動
  updateStepStatus("move-mail", "running");

  const mailFile = path.join(archiveDir, "mail.tsx");
  console.log(chalk.cyan("draft/page.tsx を mail.tsx へ移動中..."));
  fs.copyFileSync(DRAFT_FILE, mailFile);

  updateStepStatus("move-mail", "success");
  console.log(chalk.green("✓ mail.tsx 移動"));

  // 7. 画像ファイル移動
  updateStepStatus("move-assets", "running");

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
      console.log(chalk.yellow("警告: mail-assets/ に画像がありません"));
    }
  }

  updateStepStatus("move-assets", "success");
  console.log(chalk.green("✓ 画像ファイル移動"));

  // 8. config.json 生成
  updateStepStatus("create-config", "running");

  const configFile = path.join(archiveDir, "config.json");
  const config = {
    subject: answers.subject,
    segmentId: answers.segmentId,
    sentAt: null,
  };

  console.log(chalk.cyan("config.json を生成中..."));
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");

  updateStepStatus("create-config", "success");
  console.log(chalk.green("✓ config.json 生成"));

  // 9. draft/page.tsx リセット
  updateStepStatus("reset-draft", "running");

  console.log(chalk.cyan("draft/page.tsx を初期テンプレート（template.txt）からリセット中..."));
  fs.copyFileSync(TEMPLATE_FILE, DRAFT_FILE);

  updateStepStatus("reset-draft", "success");
  console.log(chalk.green("✓ draft/page.tsx リセット"));

  // 10. Git操作
  console.log(chalk.cyan("\nGit操作を実行中...\n"));

  // git add
  updateStepStatus("git-add", "running");
  console.log(chalk.gray("  $ git add ."));

  const addResult = executeGitAdd();
  if (!addResult.success) {
    updateStepStatus("git-add", "failed", addResult.error);
    displayProgress();
    displayDetailedError("add", addResult);
    process.exit(1);
  }

  updateStepStatus("git-add", "success");
  console.log(chalk.green("  ✓ git add 完了\n"));

  // git commit
  updateStepStatus("git-commit", "running");
  const commitMsg = `MAIL: ${answers.commitMessage}`;
  console.log(chalk.gray(`  $ git commit -m "${commitMsg}"`));

  const commitResult = executeGitCommit(commitMsg);
  if (!commitResult.success) {
    updateStepStatus("git-commit", "failed", commitResult.error);
    displayProgress();
    displayDetailedError("commit", commitResult);
    process.exit(1);
  }

  updateStepStatus("git-commit", "success");
  console.log(chalk.green("  ✓ git commit 完了\n"));

  // git push
  updateStepStatus("git-push", "running");
  console.log(chalk.gray("  $ git push"));

  let pushResult = executeGitPush();

  // upstream エラーの自動リトライ
  if (!pushResult.success && pushResult.needsUpstream && pushResult.branch) {
    console.log(chalk.yellow("  ⚠ upstream ブランチが設定されていません"));
    console.log(chalk.yellow("  → 自動的に upstream を設定します..."));
    console.log(
      chalk.gray(`  $ git push --set-upstream origin ${pushResult.branch}`)
    );

    pushResult = executeGitPushWithUpstream(pushResult.branch);
  }

  if (!pushResult.success) {
    updateStepStatus("git-push", "failed", pushResult.error);
    displayProgress();
    displayDetailedError("push", pushResult);
    process.exit(1);
  }

  updateStepStatus("git-push", "success");
  console.log(chalk.green("  ✓ git push 完了\n"));

  // 成功時の表示
  displayProgress();

  console.log(chalk.green.bold("✓ アーカイブ & コミットが完了しました！\n"));
  console.log(chalk.blue("次のステップ:"));
  console.log(chalk.blue("  1. PRを作成してレビュー依頼"));
  console.log(chalk.blue("  2. 上長がテストメールを確認"));
  console.log(chalk.blue("  3. 承認後にマージして本番配信\n"));
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red("エラーが発生しました:"), error);
  process.exit(1);
});
