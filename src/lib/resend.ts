import { Resend } from 'resend';

/**
 * Resend Client（遅延初期化）
 *
 * 必要な環境変数:
 * - RESEND_API_KEY
 */
let resendInstance: Resend | null = null;

/**
 * Resend Clientを取得（初回呼び出し時に初期化）
 */
export function getResendClient(): Resend {
  if (resendInstance) {
    return resendInstance;
  }

  // 環境変数チェック（初回のみ）
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  resendInstance = new Resend(process.env.RESEND_API_KEY);
  return resendInstance;
}

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
    const { data, error } = await getResendClient().segments.get(segmentId);

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
    const { data, error } = await getResendClient().segments.list();

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

/**
 * Resend Segment詳細取得（名前含む）
 *
 * segments.get() で取得できない場合、segments.list() から検索するフォールバックあり。
 *
 * @param segmentId - Resend Segment ID (UUID形式)
 * @returns Segment詳細 { id, name, created_at } または null
 */
export async function getSegmentDetails(
  segmentId: string
): Promise<{ id: string; name: string; created_at: string } | null> {
  // 方法1: segments.get() で直接取得
  try {
    const { data, error } = await getResendClient().segments.get(segmentId);

    if (error) {
      console.warn('[getSegmentDetails] segments.get() error:', JSON.stringify(error));
    }

    if (data) {
      return { id: data.id, name: data.name, created_at: data.created_at };
    }
  } catch (error) {
    console.warn('[getSegmentDetails] segments.get() exception:', error);
  }

  // 方法2: フォールバック - segments.list() から検索
  try {
    console.log('[getSegmentDetails] Falling back to segments.list()...');
    const segments = await listSegments();

    const found = segments.find(
      (s: { id: string; name: string }) => s.id === segmentId
    );

    if (found) {
      return { id: found.id, name: found.name, created_at: found.created_at || '' };
    }

    console.warn(`[getSegmentDetails] Segment not found in list: ${segmentId}`);
  } catch (error) {
    console.error('[getSegmentDetails] segments.list() fallback failed:', error);
  }

  return null;
}

/**
 * Segment内のContact一覧を取得
 *
 * contacts.list({ segmentId }) でフィルタリングする
 *
 * @param segmentId - Resend Segment ID (UUID形式)
 * @param limit - 取得件数（デフォルト: 5）
 * @returns { contacts: Contact[], hasMore: boolean }
 */
export async function listSegmentContacts(
  segmentId: string,
  limit: number = 5
): Promise<{
  contacts: { email: string; firstName: string | null; lastName: string | null }[];
  hasMore: boolean;
}> {
  try {
    const { data, error } = await getResendClient().contacts.list({
      segmentId,
      limit,
    });

    if (error) {
      console.error('Resend API Error (listSegmentContacts):', error);
      return { contacts: [], hasMore: false };
    }

    if (!data) {
      return { contacts: [], hasMore: false };
    }

    const contacts = data.data.map((c) => ({
      email: c.email,
      firstName: c.first_name,
      lastName: c.last_name,
    }));

    return { contacts, hasMore: data.has_more };
  } catch (error) {
    console.error('Failed to list segment contacts:', error);
    return { contacts: [], hasMore: false };
  }
}
