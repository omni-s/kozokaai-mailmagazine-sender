import 'dotenv/config';
import chalk from 'chalk';
import { getAllArchivesFromS3, updateConfigSentAt } from '../lib/s3';
import { prepareAndSendEmail } from '../lib/email-sender';

/**
 * Scheduled Email Delivery
 *
 * 予約配信スクリプト（cron workflowから実行）
 * - S3から全config.jsonを取得
 * - scheduledAt が現在時刻±5分以内のアーカイブを配信
 * - 重複送信防止: sentAt !== null の場合はスキップ
 */

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  Scheduled Email Delivery'));
  console.log(chalk.blue.bold('========================================\n'));

  // 環境変数チェック
  if (!process.env.S3_BUCKET_URL) {
    console.error(
      chalk.red('エラー: S3_BUCKET_URL 環境変数が設定されていません')
    );
    process.exit(1);
  }

  const s3BaseUrl = (process.env.S3_BUCKET_URL || '').replace(/\/$/, '');
  const now = new Date();

  console.log(chalk.cyan(`現在時刻: ${now.toISOString()} (UTC)\n`));

  // 1. S3から全アーカイブ取得（予約配信は全件スキャン）
  console.log(chalk.cyan('S3から全アーカイブを取得中...'));
  const allArchives = await getAllArchivesFromS3();

  if (allArchives.length === 0) {
    console.log(chalk.yellow('アーカイブが見つかりません'));
    console.log(chalk.green('✓ Scheduled Email Delivery完了（対象なし）\n'));
    process.exit(0);
  }

  console.log(chalk.green(`✓ 全アーカイブ数: ${allArchives.length}件\n`));

  // 2. 配信対象を抽出
  const targets = allArchives.filter((archive) => {
    const config = archive.config;

    // 送信済みはスキップ
    if (config.sentAt !== null) {
      return false;
    }

    // scheduledAt がない場合はスキップ（即時配信対象）
    if (!config.scheduledAt) {
      return false;
    }

    const scheduledDate = new Date(config.scheduledAt);

    // 配信時刻判定: scheduledAt <= 現在時刻 かつ scheduledAt > 現在時刻 - 5分
    const diffMinutes = (now.getTime() - scheduledDate.getTime()) / (1000 * 60);

    return diffMinutes >= 0 && diffMinutes < 5;
  });

  if (targets.length === 0) {
    console.log(chalk.yellow('配信対象が見つかりません'));
    console.log(chalk.green('✓ Scheduled Email Delivery完了（対象なし）\n'));
    process.exit(0);
  }

  console.log(chalk.cyan(`配信対象: ${targets.length}件\n`));

  // 3. 各対象を配信（全モード共通関数）
  let successCount = 0;
  let failedCount = 0;

  for (const target of targets) {
    const { yyyy, mm, ddMsg, config } = target;

    console.log(chalk.blue(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(chalk.blue(`配信中: archives/${yyyy}/${mm}/${ddMsg}`));
    console.log(chalk.blue(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));

    console.log(chalk.gray(`  件名: ${config.subject}`));
    console.log(chalk.gray(`  予約日時: ${config.scheduledAt}`));
    console.log(chalk.gray(`  Segment ID: ${config.segmentId || config.audienceId}\n`));

    try {
      const result = await prepareAndSendEmail({
        archive: target,
        s3BaseUrl,
        mode: 'production',
        config: target.config,
      });

      if (!result.success) {
        console.log(chalk.red.bold('\n✗ 配信でエラーが発生しました'));
        console.log(chalk.red(`  エラー: ${result.error}`));
        failedCount++;
        continue;
      }

      console.log(chalk.green('✓ 本番メール配信'));
      console.log(chalk.gray(`  送信ID: ${result.broadcastId}`));

      // sentAt更新（S3に反映）
      console.log(chalk.cyan('config.json の sentAt を更新中...'));
      await updateConfigSentAt(yyyy, mm, ddMsg, new Date().toISOString());
      console.log(chalk.green('✓ sentAt更新完了'));

      successCount++;
    } catch (error) {
      console.log(chalk.red.bold('\n✗ 予期しないエラーが発生しました'));
      console.error(error);
      failedCount++;
      continue;
    }
  }

  // 結果サマリー
  console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.blue('  配信結果サマリー'));
  console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.green(`  成功: ${successCount}件`));
  if (failedCount > 0) {
    console.log(chalk.red(`  失敗: ${failedCount}件`));
  }

  console.log(chalk.green.bold('\n✓ Scheduled Email Delivery完了\n'));

  if (failedCount > 0) {
    process.exit(1);
  }

  process.exit(0);
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
