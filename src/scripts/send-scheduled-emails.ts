import 'dotenv/config';
import chalk from 'chalk';
import { resend } from '../lib/resend';
import {
  getAllArchivesFromS3,
  loadMailHtmlFromS3,
  updateConfigSentAt,
} from '../lib/s3';

/**
 * Scheduled Email Delivery
 *
 * 予約配信スクリプト（cron workflowから実行）
 * - S3から全config.jsonを取得
 * - scheduledAt が現在時刻±5分以内のアーカイブを配信
 * - 重複送信防止: sentAt !== null の場合はスキップ
 */

interface ProductionEmailError {
  type: string;
  message: string;
  details?: string;
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

  // 1. S3から全config.jsonを取得
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

    // 配信時刻判定: scheduledAt ≤ 現在時刻 かつ scheduledAt > 現在時刻 - 5分
    const diffMinutes = (now.getTime() - scheduledDate.getTime()) / (1000 * 60);

    // 配信時刻到達 かつ 過去5分以内
    return diffMinutes >= 0 && diffMinutes < 5;
  });

  if (targets.length === 0) {
    console.log(chalk.yellow('配信対象が見つかりません'));
    console.log(chalk.green('✓ Scheduled Email Delivery完了（対象なし）\n'));
    process.exit(0);
  }

  console.log(chalk.cyan(`配信対象: ${targets.length}件\n`));

  // 3. 各アーカイブを配信
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

    const errors: ProductionEmailError[] = [];
    let hasError = false;

    try {
      // mail.htmlを取得
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
        console.log(chalk.red.bold('\n✗ 配信でエラーが発生しました\n'));
        errors.forEach(({ type, message, details }) => {
          console.log(chalk.red(`  タイプ: ${type}`));
          console.log(chalk.red(`  メッセージ: ${message}`));
          if (details) {
            console.log(chalk.red(`  詳細: ${details}`));
          }
          console.log();
        });
        failedCount++;
        continue;
      }

      // 型ガード: htmlResult が { html: string } であることを確認
      if (!('html' in htmlResult)) {
        console.log(chalk.red.bold('\n✗ mail.html の読み込みに失敗しました\n'));
        failedCount++;
        continue;
      }

      let html = htmlResult.html;
      console.log(chalk.green('✓ mail.html 読み込み'));

      // 画像パス置換
      html = replaceImagePaths(html, s3BaseUrl, yyyy, mm, ddMsg);
      console.log(chalk.green('✓ 画像パス置換'));

      // Resend API配信
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
        console.log(chalk.red.bold('\n✗ 配信でエラーが発生しました\n'));
        errors.forEach(({ type, message, details }) => {
          console.log(chalk.red(`  タイプ: ${type}`));
          console.log(chalk.red(`  メッセージ: ${message}`));
          if (details) {
            console.log(chalk.red(`  詳細: ${details}`));
          }
          console.log();
        });
        failedCount++;
        continue;
      }

      console.log(chalk.green('✓ 本番メール配信'));
      console.log(chalk.gray(`  送信ID: ${sendResult.id}`));

      // sentAt更新（S3に反映）
      console.log(chalk.cyan('config.json の sentAt を更新中...'));
      await updateConfigSentAt(yyyy, mm, ddMsg, new Date().toISOString());
      console.log(chalk.green('✓ sentAt更新完了'));

      successCount++;

    } catch (error) {
      console.log(chalk.red.bold('\n✗ 予期しないエラーが発生しました\n'));
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

  // 失敗があった場合はエラーコードを返す
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
