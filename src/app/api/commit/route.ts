import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { format, parse, isValid } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { uploadDirectoryToS3, uploadArchiveMetadataToS3 } from '@/lib/s3';

/**
 * プロジェクトルート
 */
const PROJECT_ROOT = process.cwd();
const DRAFT_FILE = path.join(PROJECT_ROOT, 'src/app/page.tsx');
const MAIL_ASSETS_DIR = path.join(PROJECT_ROOT, 'public/MAIL-ASSETS');
const ARCHIVES_DIR = path.join(PROJECT_ROOT, 'src/archives');

/**
 * リクエストボディの型定義
 */
interface CommitRequestBody {
  commitMessage: string;
  subject: string;
  segmentId: string;
  scheduleType: 'immediate' | 'scheduled';
  scheduledAt?: string;
  overwrite?: boolean;
}

/**
 * Git操作の結果
 */
interface GitOperationResult {
  success: boolean;
  error?: string;
  stderr?: string;
  needsUpstream?: boolean;
  branch?: string;
}

/**
 * 現在のブランチ名を取得
 */
function getCurrentBranch(): string {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();
    return branch;
  } catch {
    return 'main';
  }
}

/**
 * git add を実行
 */
function executeGitAdd(): GitOperationResult {
  try {
    execSync('git add .', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { success: true };
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && 'stderr' in error ? String(error.stderr) : 'Unknown error';
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { success: true };
  } catch (error: unknown) {
    const stdout =
      error instanceof Error && 'stdout' in error ? String(error.stdout) : '';
    const stderr =
      error instanceof Error && 'stderr' in error ? String(error.stderr) : '';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullOutput = (stdout + stderr).toLowerCase();

    // "nothing to commit" の検出
    if (
      fullOutput.includes('nothing to commit') ||
      fullOutput.includes('working tree clean')
    ) {
      return { success: true };
    }

    return {
      success: false,
      error: errorMessage,
      stderr: stdout || stderr,
    };
  }
}

/**
 * git push を実行
 */
function executeGitPush(): GitOperationResult {
  try {
    execSync('git push', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { success: true };
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && 'stderr' in error ? String(error.stderr) : 'Unknown error';

    // upstream エラーを検出
    const needsUpstream =
      stderr.toLowerCase().includes('no upstream branch') ||
      stderr.toLowerCase().includes('set-upstream');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stderr,
      needsUpstream,
      branch: needsUpstream ? getCurrentBranch() : undefined,
    };
  }
}

/**
 * git push --set-upstream を実行
 */
function executeGitPushWithUpstream(branch: string): GitOperationResult {
  try {
    execSync(`git push --set-upstream origin ${branch}`, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { success: true };
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && 'stderr' in error ? String(error.stderr) : 'Unknown error';
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stderr,
    };
  }
}


/**
 * POST /api/commit
 * メール配信準備（アーカイブ作成 + S3アップロード + Git操作）
 */
export async function POST(request: NextRequest) {
  try {
    // 1. リクエストボディを取得
    const body: CommitRequestBody = await request.json();
    const { commitMessage, subject, segmentId, scheduleType, scheduledAt } = body;

    const { overwrite = false } = body;

    console.log('[API /commit] リクエスト受信:', {
      commitMessage,
      subject,
      segmentId,
      scheduleType,
      scheduledAt,
      overwrite,
    });

    // 2. バリデーション
    if (!commitMessage || !subject || !segmentId) {
      return NextResponse.json(
        { success: false, message: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // 3. page.tsx の存在確認
    if (!fs.existsSync(DRAFT_FILE)) {
      return NextResponse.json(
        { success: false, message: 'src/app/page.tsx が見つかりません' },
        { status: 404 }
      );
    }

    // 4. アーカイブディレクトリ作成
    const now = new Date();
    const yyyy = format(now, 'yyyy');
    const mm = format(now, 'MM');
    const dd = format(now, 'dd');
    const archiveDir = path.join(ARCHIVES_DIR, yyyy, mm, `${dd}-${commitMessage}`);
    const assetsDir = path.join(archiveDir, 'assets');

    console.log('[API /commit] アーカイブディレクトリ:', archiveDir);

    if (fs.existsSync(archiveDir)) {
      if (!overwrite) {
        // 上書き未承認 → 409 Conflict
        return NextResponse.json(
          {
            success: false,
            message: `アーカイブ ${dd}-${commitMessage} は既に存在します`,
          },
          { status: 409 }
        );
      }

      // 上書き承認済み → 既存ディレクトリ削除
      console.log('[API /commit] 既存アーカイブを削除中...', archiveDir);
      try {
        fs.rmSync(archiveDir, { recursive: true, force: true });
        console.log('[API /commit] 既存アーカイブ削除完了');
      } catch (deleteError) {
        console.error('[API /commit] アーカイブ削除エラー:', deleteError);
        return NextResponse.json(
          {
            success: false,
            message: '既存アーカイブの削除に失敗しました。ファイルがロックされている可能性があります。',
          },
          { status: 500 }
        );
      }
    }

    fs.mkdirSync(archiveDir, { recursive: true });
    fs.mkdirSync(assetsDir, { recursive: true });

    console.log('[API /commit] アーカイブディレクトリ作成完了');

    // 5. mail.tsx のコピー
    const mailFile = path.join(archiveDir, 'mail.tsx');
    fs.copyFileSync(DRAFT_FILE, mailFile);

    console.log('[API /commit] mail.tsx コピー完了');

    // 6. mail.html の生成（別プロセスで実行）
    console.log('[API /commit] mail.html 変換開始...');

    const mailHtmlPath = path.join(archiveDir, 'mail.html');

    try {
      execSync(`npx tsx src/scripts/generate-mail-html.ts "${mailFile}" "${mailHtmlPath}"`, {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      console.log('[API /commit] mail.html 変換完了');
    } catch (error) {
      console.error('[API /commit] mail.html 変換エラー:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'mail.html の生成に失敗しました',
        },
        { status: 500 }
      );
    }

    // 7. assets/ の移動
    if (fs.existsSync(MAIL_ASSETS_DIR)) {
      const files = fs.readdirSync(MAIL_ASSETS_DIR);
      if (files.length > 0) {
        console.log(`[API /commit] 画像ファイルコピー中... (${files.length}件)`);
        files.forEach((file) => {
          const srcPath = path.join(MAIL_ASSETS_DIR, file);
          const destPath = path.join(assetsDir, file);
          fs.copyFileSync(srcPath, destPath);
          // 元ファイルは削除しない（再編集時のため保持）
        });
        console.log('[API /commit] 画像ファイルコピー完了');
      } else {
        console.log('[API /commit] 警告: MAIL-ASSETS/ に画像がありません');
      }
    }

    // 8. config.json の生成
    let scheduledAtDate: string | null = null;

    if (scheduleType === 'scheduled' && scheduledAt) {
      const jstDate = parse(scheduledAt.trim(), 'yyyy-MM-dd HH:mm', new Date());
      if (!isValid(jstDate)) {
        return NextResponse.json(
          { success: false, message: '配信日時の形式が不正です' },
          { status: 400 }
        );
      }
      const utcDate = fromZonedTime(jstDate, 'Asia/Tokyo');
      scheduledAtDate = utcDate.toISOString();

      console.log('[API /commit] 配信予定日時:', {
        jst: format(jstDate, 'yyyy-MM-dd HH:mm'),
        utc: scheduledAtDate,
      });
    }

    const config = {
      subject,
      segmentId,
      scheduledAt: scheduledAtDate,
      sentAt: null,
    };

    const configFile = path.join(archiveDir, 'config.json');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');

    console.log('[API /commit] config.json 生成完了');

    // 9. S3 アップロード
    console.log('[API /commit] S3アップロード開始...');

    try {
      // クロスプラットフォーム対応: Windows/Linux/macOS
      // Step 1: プロジェクトルートからの相対パスを取得
      const relativePath = path.relative(PROJECT_ROOT, archiveDir);

      // Step 2: すべてのパスセパレータをフォワードスラッシュに統一（S3キー形式）
      const s3Prefix = relativePath.split(path.sep).join('/').replace(/^src\//, '');

      // 画像をS3にアップロード
      const assetsResults: Array<{
        file: string;
        success: boolean;
        url?: string;
        error?: string;
      }> = [];

      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        if (files.length > 0) {
          console.log(`[API /commit] 画像をS3にアップロード中... (${files.length}件)`);
          const uploadResults = await uploadDirectoryToS3(assetsDir, `${s3Prefix}/assets`);
          assetsResults.push(...uploadResults);
        }
      }

      // メタデータをS3にアップロード
      console.log('[API /commit] メタデータをS3にアップロード中...');
      const metadataResults = await uploadArchiveMetadataToS3(archiveDir, s3Prefix);

      // 結果を統合
      const allResults = [...assetsResults, ...metadataResults];
      const uploadSuccess = allResults.filter((r) => r.success).length;
      const uploadFailed = allResults.filter((r) => !r.success).length;

      if (uploadFailed > 0) {
        console.error(
          `[API /commit] S3アップロードでエラーが発生しました (${uploadFailed}/${allResults.length}件)`
        );
        return NextResponse.json(
          {
            success: false,
            message: `S3アップロードでエラーが発生しました (${uploadFailed}/${allResults.length}件)`,
          },
          { status: 500 }
        );
      }

      console.log(
        `[API /commit] S3アップロード完了 (${uploadSuccess}/${allResults.length}件)`
      );
    } catch (error) {
      console.error('[API /commit] S3アップロードエラー:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'S3アップロードでエラーが発生しました',
        },
        { status: 500 }
      );
    }

    // 10. Git 操作
    console.log('[API /commit] Git操作開始...');

    // git add
    const addResult = executeGitAdd();
    if (!addResult.success) {
      console.error('[API /commit] git add エラー:', addResult.error);
      return NextResponse.json(
        {
          success: false,
          message: `git add エラー: ${addResult.error}`,
        },
        { status: 500 }
      );
    }
    console.log('[API /commit] git add 完了');

    // git commit
    const commitMsg = `MAIL: ${commitMessage}`;
    const commitResult = executeGitCommit(commitMsg);
    if (!commitResult.success) {
      console.error('[API /commit] git commit エラー:', commitResult.error);
      return NextResponse.json(
        {
          success: false,
          message: `git commit エラー: ${commitResult.error}`,
        },
        { status: 500 }
      );
    }
    console.log('[API /commit] git commit 完了');

    // git push
    let pushResult = executeGitPush();

    // upstream エラーの自動リトライ
    if (!pushResult.success && pushResult.needsUpstream && pushResult.branch) {
      console.log('[API /commit] upstream ブランチが設定されていません。自動設定中...');
      pushResult = executeGitPushWithUpstream(pushResult.branch);
    }

    if (!pushResult.success) {
      console.error('[API /commit] git push エラー:', pushResult.error);
      return NextResponse.json(
        {
          success: false,
          message: `git push エラー: ${pushResult.error}`,
        },
        { status: 500 }
      );
    }
    console.log('[API /commit] git push 完了');

    // 11. 成功レスポンス
    return NextResponse.json({
      success: true,
      message: '配信準備が完了しました。PRを作成してレビュー依頼してください。',
      archiveDir: `${yyyy}/${mm}/${dd}-${commitMessage}`,
    });
  } catch (error) {
    console.error('[API /commit] エラー:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '不明なエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
