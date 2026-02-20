import { getResendClient } from './resend';
import {
  getAllArchivesFromS3,
  loadConfigFromS3,
  loadMailHtmlFromS3,
} from './s3';
import { type Config } from './config-schema';

/**
 * 配信モード
 * - test: テスト配信（[TEST]プレフィックス付き、sentAt更新なし）
 * - production: 本番配信
 */
export type SendMode = 'test' | 'production';

/**
 * アーカイブ座標（S3パス構成要素）
 */
export interface ArchiveCoordinates {
  yyyy: string;
  mm: string;
  ddMsg: string;
}

/**
 * config.json付きアーカイブ
 */
export interface ArchiveWithConfig extends ArchiveCoordinates {
  config: Config;
}

/**
 * prepareAndSendEmail のオプション
 */
export interface PrepareAndSendOptions {
  archive: ArchiveCoordinates;
  s3BaseUrl: string;
  mode: SendMode;
  testSegmentId?: string;
  config?: Config;
}

/**
 * 送信結果
 */
export interface SendResult {
  success: boolean;
  broadcastId?: string;
  subject: string;
  segmentId: string;
  error?: string;
}

/**
 * S3から最新の未送信アーカイブを取得
 *
 * 全3モード（テスト・即時・予約）共通の特定方法。
 * S3のLastModified降順で最新10件を取得し、sentAt === null の最初のアーカイブを返す。
 */
export async function getLatestUnsentArchive(): Promise<ArchiveWithConfig | null> {
  const archives = await getAllArchivesFromS3(10);
  return archives.find((a) => a.config.sentAt === null) || null;
}

/**
 * 画像パスを /MAIL-ASSETS/ から S3 URL に置換
 *
 * 大文字小文字不問（/mail-assets/ も対応）
 */
export function replaceImagePaths(
  html: string,
  s3BaseUrl: string,
  archive: ArchiveCoordinates
): string {
  const { yyyy, mm, ddMsg } = archive;
  const pattern =
    /<[Ii]mg[^>]*src=['"]\/[Mm][Aa][Ii][Ll]-[Aa][Ss][Ss][Ee][Tt][Ss]\/([^'"]+)['"]/g;

  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(
      /\/[Mm][Aa][Ii][Ll]-[Aa][Ss][Ss][Ee][Tt][Ss]\/[^'"]+/,
      s3Url
    );
  });
}

/**
 * Resend Broadcasts API でメール送信
 *
 * 全3モード共通の送信処理。
 * - test: [TEST]プレフィックス付き、RESEND_TEST_FROM_EMAIL優先
 * - production: プレフィックスなし
 */
async function sendBroadcast(params: {
  html: string;
  subject: string;
  segmentId: string;
  mode: SendMode;
}): Promise<{ success: boolean; broadcastId?: string; error?: string }> {
  const { html, subject, segmentId, mode } = params;

  const isTest = mode === 'test';
  const fromEmail = isTest
    ? process.env.RESEND_TEST_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    : process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.RESEND_FROM_NAME;
  const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const replyTo = process.env.RESEND_REPLY_TO || fromEmail;

  const broadcastName = isTest
    ? `[TEST] Broadcast - ${subject}`
    : `Broadcast - ${subject}`;
  const broadcastSubject = isTest ? `[TEST] ${subject}` : subject;

  try {
    // Step 1: Broadcast を作成
    const { data: createData, error: createError } =
      await getResendClient().broadcasts.create({
        name: broadcastName,
        segmentId,
        from: fromAddress,
        replyTo,
        subject: broadcastSubject,
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
    const { data: sendData, error: sendError } =
      await getResendClient().broadcasts.send(createData.id);

    if (sendError) {
      return {
        success: false,
        error: sendError.message || 'Broadcast送信エラー',
      };
    }

    return {
      success: true,
      broadcastId: sendData?.id || createData.id,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'メール配信に失敗しました',
    };
  }
}

/**
 * 統合オーケストレーター: config/HTML読込→画像置換→segmentId決定→送信
 *
 * 全3モード（テスト・即時・予約）が通る唯一の配信処理。
 *
 * - config: 事前ロード済みならS3再ロードをスキップ
 * - testSegmentId: mode==='test'時に必須
 */
export async function prepareAndSendEmail(
  options: PrepareAndSendOptions
): Promise<SendResult> {
  const { archive, s3BaseUrl, mode, testSegmentId, config: preloadedConfig } = options;
  const { yyyy, mm, ddMsg } = archive;

  // 1. config.json ロード
  let config: Config;
  if (preloadedConfig) {
    config = preloadedConfig;
  } else {
    config = await loadConfigFromS3(yyyy, mm, ddMsg);
  }

  // 2. mail.html ロード
  const htmlResult = await loadMailHtmlFromS3(yyyy, mm, ddMsg);
  if ('error' in htmlResult) {
    return {
      success: false,
      subject: config.subject,
      segmentId: '',
      error: `mail.html の読み込みに失敗しました: ${htmlResult.error}`,
    };
  }

  // 3. 画像パス置換
  const html = replaceImagePaths(htmlResult.html, s3BaseUrl, archive);

  // 4. segmentId決定
  const segmentId =
    mode === 'test'
      ? testSegmentId!
      : config.segmentId || config.audienceId!;

  // 5. 送信
  const result = await sendBroadcast({ html, subject: config.subject, segmentId, mode });

  return {
    success: result.success,
    broadcastId: result.broadcastId,
    subject: mode === 'test' ? `[TEST] ${config.subject}` : config.subject,
    segmentId,
    error: result.error,
  };
}
