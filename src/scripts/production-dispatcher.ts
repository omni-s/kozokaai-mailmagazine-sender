import 'dotenv/config';
import chalk from 'chalk';
import { updateConfigSentAt } from '../lib/s3';
import { getLatestUnsentArchive, prepareAndSendEmail } from '../lib/email-sender';

/**
 * Production Dispatcher
 *
 * mainブランチpush時の配信ディスパッチャー
 * - scheduledAt === null → 即時配信実行
 * - scheduledAt !== null && scheduledAt <= 現在時刻 → 即時配信実行（過去日時）
 * - scheduledAt !== null && scheduledAt > 現在時刻 → ログ出力のみ（予約配信待機）
 */

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

  const s3BaseUrl = (process.env.S3_BUCKET_URL || '').replace(/\/$/, '');

  // 1. S3から最新未送信アーカイブ取得（全モード共通関数）
  console.log(chalk.cyan('S3から最新未送信アーカイブを取得中...'));
  const archive = await getLatestUnsentArchive();

  if (!archive) {
    console.log(chalk.yellow('未送信アーカイブが見つかりません'));
    console.log(chalk.green('✓ Production Dispatcher完了（対象なし）\n'));
    process.exit(0);
  }

  const { yyyy, mm, ddMsg } = archive;
  const archivePath = `archives/${yyyy}/${mm}/${ddMsg}`;
  const config = archive.config;

  console.log(chalk.green(`✓ 対象アーカイブ: ${archivePath}`));

  // 2. scheduledAtチェック
  if (config.scheduledAt) {
    const scheduledDate = new Date(config.scheduledAt);
    const now = new Date();

    console.log(chalk.cyan('\n配信タイプ: 予約配信'));
    console.log(chalk.cyan(`  予約日時: ${scheduledDate.toISOString()} (UTC)`));
    console.log(chalk.cyan(`  現在時刻: ${now.toISOString()} (UTC)`));

    if (scheduledDate > now) {
      // 未来 → cron待ち
      console.log(chalk.cyan('\n予約配信待機中...'));
      console.log(chalk.cyan('  scheduled-email-delivery.yml で配信予定です\n'));
      console.log(chalk.green('✓ Production Dispatcher完了（予約配信待機）\n'));
      process.exit(0);
    }

    // 過去日時 → 即時配信（エッジケース対応）
    console.log(chalk.yellow('\n警告: 予約日時が過去です'));
  } else {
    console.log(chalk.cyan('\n配信タイプ: 即時配信'));
  }

  // 3. 即時配信（全モード共通関数）
  console.log(chalk.cyan('本番メールを送信中...'));
  const result = await prepareAndSendEmail({
    archive,
    s3BaseUrl,
    mode: 'production',
    config,
  });

  if (!result.success) {
    console.log(chalk.red.bold('\n✗ 本番配信でエラーが発生しました'));
    console.log(chalk.red(`  エラー: ${result.error}`));
    process.exit(1);
  }

  console.log(chalk.green('✓ 本番メール配信'));
  console.log(chalk.gray(`  送信ID: ${result.broadcastId}`));
  console.log(chalk.gray(`  Segment ID: ${result.segmentId}`));
  console.log(chalk.gray(`  件名: ${result.subject}`));

  // 4. sentAt更新（S3に反映）
  console.log(chalk.cyan('config.json の sentAt を更新中...'));
  try {
    await updateConfigSentAt(yyyy, mm, ddMsg, new Date().toISOString());
    console.log(chalk.green('✓ sentAt更新完了'));
  } catch (error) {
    console.error(chalk.yellow('警告: sentAt更新に失敗しました'), error);
  }

  console.log(chalk.green.bold('\n✓ 本番メール配信が完了しました\n'));
  process.exit(0);
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
