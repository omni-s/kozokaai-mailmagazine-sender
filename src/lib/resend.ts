import { Resend } from 'resend';

/**
 * Resend SDK初期化
 *
 * 環境変数 RESEND_API_KEY が必要
 */
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Resend Segment存在確認
 *
 * @param segmentId - Resend Segment ID (UUID形式)
 * @returns 存在する場合 true
 */
export async function checkSegmentExists(
  segmentId: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.segments.get(segmentId);

    if (error) {
      console.error('Resend API Error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Failed to check segment:', error);
    return false;
  }
}

/**
 * Resend Audience存在確認
 *
 * @deprecated Use checkSegmentExists instead
 * @param audienceId - Resend Audience ID
 * @returns 存在する場合 true
 */
export async function checkAudienceExists(
  audienceId: string
): Promise<boolean> {
  return checkSegmentExists(audienceId);
}

/**
 * Resend Segment一覧取得
 *
 * @returns Segment一覧
 */
export async function listSegments() {
  try {
    const { data, error } = await resend.segments.list();

    // デバッグログ: 実際のAPI応答を確認
    console.log('[listSegments] API response:', JSON.stringify({ data, error }, null, 2));

    if (error) {
      console.error('Resend API Error:', error);
      return [];
    }

    // Resend SDK v6.6.0: data = { object: 'list', data: Segment[], has_more: boolean }
    // 配列として直接返ってくる場合も考慮
    if (Array.isArray(data)) {
      return data;
    }
    return data?.data || [];
  } catch (error) {
    console.error('Failed to list segments:', error);
    return [];
  }
}

/**
 * Resend Audience一覧取得
 *
 * @deprecated Use listSegments instead
 * @returns Audience一覧
 */
export async function listAudiences() {
  return listSegments();
}
