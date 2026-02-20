import 'dotenv/config';
import chalk from 'chalk';
import { writeFileSync, appendFileSync } from 'fs';
import { getSegmentDetails, listSegmentContacts } from '../lib/resend';
import { type Config } from '../lib/config-schema';
import { getLatestPendingArchive, prepareAndSendEmail } from '../lib/email-sender';
import { updateConfigFields } from '../lib/s3';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * GitHub Actions Staging Workflow用テストメール送信スクリプト
 *
 * S3から最新の未送信アーカイブを取得し、以下を実行:
 * 1. 共通コア（prepareAndSendEmail）でテスト配信
 * 2. 配信確認サマリーをMarkdownで生成
 */

/**
 * メールアドレスをマスク処理する
 * 例: kozoka@example.com -> koz***@example.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 3 ? local[0] : local.substring(0, 3);
  return `${visible}***@${domain}`;
}

/**
 * 配信確認サマリーをMarkdownで生成する
 */
async function generateDeliverySummary(params: {
  config: Config;
  s3ArchivePath: string;
  testSegmentId: string;
  broadcastId: string;
}): Promise<string> {
  const { config, s3ArchivePath, testSegmentId, broadcastId } = params;

  // 本番Segment情報を取得
  const productionSegmentId = config.segmentId || config.audienceId || 'unknown';
  const productionSegment = await getSegmentDetails(productionSegmentId);
  const productionSegmentName = productionSegment?.name || '(取得できませんでした)';

  // 本番Segment受信者サンプルを取得
  const { contacts, hasMore } = await listSegmentContacts(productionSegmentId, 5);

  // テストSegment情報を取得
  const testSegment = await getSegmentDetails(testSegmentId);
  const testSegmentName = testSegment?.name || '(取得できませんでした)';

  // 配信タイプを判定
  const deliveryType = config.scheduledAt ? '予約配信' : '即時配信';
  const scheduledDisplay = config.scheduledAt
    ? formatInTimeZone(new Date(config.scheduledAt), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm') + '（JST）'
    : '-';

  // Markdownを構築
  const lines: string[] = [];
  lines.push('<!-- delivery-confirmation-bot -->');
  lines.push('## メール配信確認サマリー');
  lines.push('');
  lines.push('### 配信メール情報');
  lines.push('');
  lines.push('| 項目 | 値 |');
  lines.push('|------|-----|');
  lines.push(`| 件名 | ${config.subject} |`);
  lines.push(`| アーカイブ | \`${s3ArchivePath}\` |`);
  lines.push(`| 配信タイプ | ${deliveryType} |`);
  lines.push(`| 予約日時 | ${scheduledDisplay} |`);
  lines.push('');
  lines.push('### 本番配信先 Segment');
  lines.push('');
  lines.push('| 項目 | 値 |');
  lines.push('|------|-----|');
  lines.push(`| Segment名 | ${productionSegmentName} |`);
  lines.push(`| Segment ID | \`${productionSegmentId}\` |`);
  lines.push('');

  if (contacts.length > 0) {
    lines.push('**受信者サンプル（先頭5名）:**');
    lines.push('');
    lines.push('| # | メールアドレス |');
    lines.push('|---|---------------|');
    contacts.forEach((contact, index) => {
      lines.push(`| ${index + 1} | ${maskEmail(contact.email)} |`);
    });
    if (hasMore) {
      lines.push('| ... | 他にも受信者がいます |');
    }
    lines.push('');
  }

  lines.push('> **確認してください**: 上記の本番Segmentが正しい配信先であることを確認してください。');
  lines.push('');
  lines.push('### テスト配信結果');
  lines.push('');
  lines.push('| 項目 | 値 |');
  lines.push('|------|-----|');
  lines.push(`| テストSegment | ${testSegmentName} (\`${testSegmentId}\`) |`);
  lines.push(`| Broadcast ID | \`${broadcastId}\` |`);
  lines.push('| ステータス | 送信成功 |');
  lines.push('');
  lines.push('> テストメールが送信されました。受信したメールの内容を確認してください。');
  lines.push('');

  return lines.join('\n');
}

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend メール配信システム'));
  console.log(chalk.blue.bold('  テストメール送信'));
  console.log(chalk.blue.bold('========================================\n'));

  // 環境変数チェック
  if (!process.env.S3_BUCKET_URL) {
    console.error(
      chalk.red('エラー: S3_BUCKET_URL 環境変数が設定されていません')
    );
    process.exit(1);
  }

  const testSegmentId = process.env.TEST_SEGMENT_ID;
  if (!testSegmentId) {
    console.error(
      chalk.red('エラー: TEST_SEGMENT_ID 環境変数が設定されていません')
    );
    process.exit(1);
  }

  const s3BaseUrl = (process.env.S3_BUCKET_URL || '').replace(/\/$/, '');

  // 1. S3から最新pendingアーカイブ取得
  console.log(chalk.cyan('S3から最新pendingアーカイブを取得中...'));
  const archive = await getLatestPendingArchive();

  if (!archive) {
    console.log(chalk.yellow('pendingアーカイブが見つかりません'));
    console.log(chalk.green('✓ テストメール送信完了（対象なし）\n'));
    process.exit(0);
  }

  const { yyyy, mm, ddMsg } = archive;
  const s3ArchivePath = `archives/${yyyy}/${mm}/${ddMsg}`;
  console.log(chalk.green(`✓ 対象アーカイブ: ${s3ArchivePath}`));

  // 2. テスト配信（全モード共通関数）
  console.log(chalk.cyan('テストメールを送信中...'));
  const result = await prepareAndSendEmail({
    archive,
    s3BaseUrl,
    mode: 'test',
    testSegmentId,
    config: archive.config,
  });

  if (!result.success) {
    console.log(chalk.red.bold('\n✗ テストメール送信でエラーが発生しました'));
    console.log(chalk.red(`  エラー: ${result.error}`));
    process.exit(1);
  }

  console.log(chalk.green('✓ テストメール送信'));
  console.log(chalk.gray(`  送信ID: ${result.broadcastId}`));
  console.log(chalk.gray(`  送信方法: Segment一斉送信`));
  console.log(chalk.gray(`  Test Segment ID: ${testSegmentId}`));
  console.log(chalk.gray(`  件名: ${result.subject}`));

  // 3. status を "tested" に更新
  console.log(chalk.cyan('config.json の status を tested に更新中...'));
  try {
    await updateConfigFields(yyyy, mm, ddMsg, { status: 'tested' });
    console.log(chalk.green('✓ status更新完了'));
  } catch (error) {
    console.error(chalk.red('エラー: status更新に失敗しました'), error);
    process.exit(1);
  }

  // 4. テスト固有: 配信確認サマリー生成
  console.log(chalk.cyan('\n配信確認サマリーを生成中...'));
  try {
    const summary = await generateDeliverySummary({
      config: archive.config,
      s3ArchivePath,
      testSegmentId,
      broadcastId: result.broadcastId || 'unknown',
    });

    writeFileSync('.delivery-summary.md', summary, 'utf-8');
    console.log(chalk.green('✓ .delivery-summary.md を生成しました'));

    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf-8');
      console.log(chalk.green('✓ GitHub Step Summary に書き出しました'));
    }
  } catch (summaryError) {
    console.log(chalk.yellow(`⚠ サマリー生成に失敗しました: ${summaryError}`));
  }

  console.log(chalk.green.bold('\n✓ テストメール送信が完了しました\n'));
  process.exit(0);
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
