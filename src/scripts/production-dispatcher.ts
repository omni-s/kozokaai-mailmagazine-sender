import 'dotenv/config';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { resend } from '../lib/resend';
import { type Config } from '../lib/config-schema';
import {
  getTargetArchiveFromS3,
  loadConfigFromS3,
  loadMailHtmlFromS3,
  updateConfigSentAt,
} from '../lib/s3';

/**
 * Production Dispatcher
 *
 * mainブランチpush時の配信ディスパッチャー
 * - scheduledAt === null → 即時配信実行
 * - scheduledAt !== null && scheduledAt <= 現在時刻 → 即時配信実行（過去日時）
 * - scheduledAt !== null && scheduledAt > 現在時刻 → ログ出力のみ（予約配信待機）
 */

const PROJECT_ROOT = process.cwd();

interface ProductionEmailError {
  type: string;
  message: string;
  details?: string;
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
 * 画像パスを /MAIL-ASSETS/ から S3 URL に置換
 */
function replaceImagePaths(
  html: string,
  s3BaseUrl: string,
  yyyy: string,
  mm: string,
  ddMsg: string
): string {
  // <Img> と <img> の両方に対応（大文字小文字不問）
  const pattern = /<[Ii]mg[^>]*src=['"]\/MAIL-ASSETS\/([^'"]+)['"]/g;

  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(/\/MAIL-ASSETS\/[^'"]+/, s3Url);
  });
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
 * 即時配信を実行
 */
async function sendProductionEmailImmediately(
  yyyy: string,
  mm: string,
  ddMsg: string,
  config: Config,
  s3BaseUrl: string
): Promise<void> {
  console.log(chalk.cyan('\n即時配信を実行します...\n'));

  const errors: ProductionEmailError[] = [];
  let hasError = false;

  // 1. S3からmail.htmlを取得
  console.log(chalk.cyan('S3からmail.htmlを取得中...'));
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

  // 型ガード: htmlResult が { html: string } であることを確認
  if (!('html' in htmlResult)) {
    console.log(chalk.red.bold('\n✗ mail.html の読み込みに失敗しました\n'));
    process.exit(1);
  }

  let html = htmlResult.html;
  console.log(chalk.green('✓ mail.html 読み込み'));

  // 2. 画像パス置換
  html = replaceImagePaths(html, s3BaseUrl, yyyy, mm, ddMsg);
  console.log(chalk.green('✓ 画像パス置換'));

  // 3. 本番配信
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

  // 4. sentAt更新（S3に反映）
  console.log(chalk.cyan('config.json の sentAt を更新中...'));
  try {
    await updateConfigSentAt(yyyy, mm, ddMsg, new Date().toISOString());
    console.log(chalk.green('✓ sentAt更新完了'));
  } catch (error) {
    console.error(chalk.yellow('警告: sentAt更新に失敗しました'), error);
  }

  console.log(chalk.green.bold('\n✓ 本番メール配信が完了しました\n'));
}

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  Production Dispatcher'));
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

  // 1. Gitコミットから対象archiveを特定
  const directoryName = getTargetArchiveFromCommit();

  if (!directoryName) {
    console.log(chalk.yellow('MAIL: プレフィックスを持つコミットが見つかりませんでした'));
    console.log(chalk.green('✓ Production Dispatcher完了（対象なし）\n'));
    process.exit(0);
  }

  // 2. S3から対象archiveを取得
  console.log(chalk.cyan('検出方法: Gitコミットメッセージ'));
  console.log(chalk.cyan('S3でディレクトリ名を検索中...\n'));

  const archiveMetadata = await getTargetArchiveFromS3(directoryName);

  if (!archiveMetadata) {
    console.log(chalk.red(`エラー: "${directoryName}" に一致するアーカイブが見つかりませんでした`));
    console.log(chalk.green('✓ Production Dispatcher完了（対象なし）\n'));
    process.exit(0);
  }

  const { yyyy, mm, ddMsg } = archiveMetadata;
  const archivePath = `archives/${yyyy}/${mm}/${ddMsg}`;

  console.log(chalk.cyan(`対象アーカイブ: ${archivePath}\n`));

  // 3. S3からconfig.jsonを取得
  console.log(chalk.cyan('S3からconfig.jsonを取得中...'));
  const config = await loadConfigFromS3(yyyy, mm, ddMsg);
  console.log(chalk.green('✓ config.json 読み込み'));

  // 4. scheduledAtチェック
  if (!config.scheduledAt) {
    // 即時配信（scheduledAt が null または undefined）
    console.log(chalk.cyan('\n配信タイプ: 即時配信'));
    await sendProductionEmailImmediately(yyyy, mm, ddMsg, config, s3BaseUrl);

  } else {
    // 予約配信
    const scheduledDate = new Date(config.scheduledAt);
    const now = new Date();

    console.log(chalk.cyan('\n配信タイプ: 予約配信'));
    console.log(chalk.cyan(`  予約日時: ${scheduledDate.toISOString()} (UTC)`));
    console.log(chalk.cyan(`  現在時刻: ${now.toISOString()} (UTC)`));

    if (scheduledDate <= now) {
      // 過去日時 → 即時配信（エッジケース対応）
      console.log(chalk.yellow('\n警告: 予約日時が過去です'));
      await sendProductionEmailImmediately(yyyy, mm, ddMsg, config, s3BaseUrl);

    } else {
      // 未来日時 → ログ出力のみ
      console.log(chalk.cyan('\n予約配信待機中...'));
      console.log(chalk.cyan('  scheduled-email-delivery.yml で配信予定です\n'));
      console.log(chalk.green('✓ Production Dispatcher完了（予約配信待機）\n'));
      process.exit(0);
    }
  }

  process.exit(0);
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
