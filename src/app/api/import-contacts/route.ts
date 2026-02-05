import { Resend } from 'resend';
import {
  ImportContactsRequestSchema,
  type ImportEvent,
  type PropertyConfig,
} from '@/lib/import-contacts-schema';
import { parseBooleanValue } from '@/lib/csv-parser';

// スロットリング設定
const THROTTLE_MS = 667;
const RETRY_WAIT_MS = 5000;
const MAX_RETRIES = 3;
const PROGRESS_INTERVAL = 10;

/**
 * 指定ミリ秒待機する
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 単一のコンタクトを作成する（リトライ付き）
 */
async function createContactWithRetry(
  resend: Resend,
  audienceId: string,
  email: string,
  firstName: string | undefined,
  lastName: string | undefined,
  unsubscribed: boolean | undefined,
  properties: Record<string, string | number | null> | undefined,
  retries = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.contacts.create({
      audienceId,
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      unsubscribed,
      properties:
        properties && Object.keys(properties).length > 0 ? properties : undefined,
    });

    if (error) {
      if ('statusCode' in error && (error as { statusCode: number }).statusCode === 429) {
        if (retries < MAX_RETRIES) {
          await sleep(RETRY_WAIT_MS);
          return createContactWithRetry(
            resend,
            audienceId,
            email,
            firstName,
            lastName,
            unsubscribed,
            properties,
            retries + 1
          );
        }
        return {
          success: false,
          error: `Rate limit exceeded (${MAX_RETRIES} retries exhausted)`,
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('429') || message.includes('rate limit')) {
      if (retries < MAX_RETRIES) {
        await sleep(RETRY_WAIT_MS);
        return createContactWithRetry(
          resend,
          audienceId,
          email,
          firstName,
          lastName,
          unsubscribed,
          properties,
          retries + 1
        );
      }
    }

    return { success: false, error: message };
  }
}

/**
 * カスタムプロパティを作成する（既存の場合はスキップ）
 */
async function ensureProperties(
  resend: Resend,
  propertyConfigs: PropertyConfig[]
): Promise<{ success: boolean; error?: string }> {
  if (propertyConfigs.length === 0) {
    return { success: true };
  }

  try {
    const { data: listData, error: listError } =
      await resend.contactProperties.list();
    if (listError) {
      return { success: false, error: listError.message };
    }

    const existingKeys = new Set(listData?.data?.map((p) => p.key) || []);

    for (const config of propertyConfigs) {
      if (existingKeys.has(config.key)) {
        continue;
      }

      const createOptions =
        config.type === 'string'
          ? {
              key: config.key,
              type: 'string' as const,
              fallbackValue: config.fallbackValue as string | null | undefined,
            }
          : {
              key: config.key,
              type: 'number' as const,
              fallbackValue: config.fallbackValue as number | null | undefined,
            };

      const { error } = await resend.contactProperties.create(createOptions);

      if (error) {
        return {
          success: false,
          error: `Failed to create property "${config.key}": ${error.message}`,
        };
      }
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * POST /api/import-contacts
 *
 * コンタクトをインポートする（SSE対応）
 */
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parseResult = ImportContactsRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation error',
        details: parseResult.error.errors,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { records, audienceId, propertyConfigs, columnAnalysis } =
    parseResult.data;

  const resend = new Resend(apiKey);

  // SSE ストリームを開始（TransformStreamでバッファリング問題を解決）
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();

  // 非同期で処理を実行
  (async () => {
    const writer = writable.getWriter();

    let writerClosed = false;

    const sendEvent = async (event: ImportEvent) => {
      if (writerClosed) return;
      try {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        await writer.write(encoder.encode(payload));
      } catch {
        writerClosed = true;
      }
    };

    try {
      // SSEバッファリング対策: コメント行パディングで即座にフラッシュを促す
      await writer.write(encoder.encode(': ping\n\n'));

      console.log(`[import-contacts] Import started: ${records.length} records → audience ${audienceId}`);

      // 初期進捗イベントを即座に送信
      await sendEvent({
        type: 'progress',
        current: 0,
        total: records.length,
        successCount: 0,
        failCount: 0,
      });

      // カスタムプロパティを作成
      const propResult = await ensureProperties(resend, propertyConfigs);
      if (!propResult.success) {
        await sendEvent({ type: 'error', message: propResult.error || 'Failed to create properties' });
        return;
      }

      // 標準フィールドのマッピングを逆引きで準備
      const fieldToColumn = new Map<string, string>();
      for (const [csvCol, field] of columnAnalysis.standard) {
        fieldToColumn.set(field, csvCol);
      }

      const total = records.length;
      let successCount = 0;
      let failCount = 0;
      const failures: Array<{ email: string; error: string }> = [];

      for (let i = 0; i < total; i++) {
        const record = records[i];
        const loopStart = Date.now();

        const email = columnAnalysis.emailColumn
          ? record[columnAnalysis.emailColumn]?.trim()
          : undefined;

        if (!email) {
          failures.push({ email: '(empty)', error: 'emailが空です' });
          failCount++;

          if ((i + 1) % PROGRESS_INTERVAL === 0 || i + 1 === total) {
            await sendEvent({
              type: 'progress',
              current: i + 1,
              total,
              successCount,
              failCount,
            });
          }

          if (writerClosed) {
            console.log(`[import-contacts] Client disconnected at (${i + 1}/${total}). Stopping.`);
            break;
          }
          continue;
        }

        const firstNameCol = fieldToColumn.get('firstName');
        const lastNameCol = fieldToColumn.get('lastName');
        const unsubscribedCol = fieldToColumn.get('unsubscribed');

        const firstName = firstNameCol
          ? record[firstNameCol]?.trim() || undefined
          : undefined;
        const lastName = lastNameCol
          ? record[lastNameCol]?.trim() || undefined
          : undefined;
        const unsubscribed = unsubscribedCol
          ? parseBooleanValue(record[unsubscribedCol] || '')
          : undefined;

        // カスタムプロパティ取得
        let properties: Record<string, string | number | null> | undefined;
        if (propertyConfigs.length > 0) {
          properties = {};
          for (const config of propertyConfigs) {
            const rawValue = record[config.columnName]?.trim();
            if (rawValue === undefined || rawValue === '') {
              properties[config.key] = config.fallbackValue;
            } else if (config.type === 'number') {
              const num = Number(rawValue);
              properties[config.key] = isNaN(num)
                ? config.fallbackValue
                : num;
            } else {
              properties[config.key] = rawValue;
            }
          }
        }

        const result = await createContactWithRetry(
          resend,
          audienceId,
          email,
          firstName,
          lastName,
          unsubscribed,
          properties
        );

        if (result.success) {
          successCount++;
          console.log(`[import-contacts] ✓ (${i + 1}/${total}) ${email}`);
        } else {
          failCount++;
          failures.push({ email, error: result.error || 'Unknown error' });
          console.error(`[import-contacts] ✗ (${i + 1}/${total}) ${email}: ${result.error}`);
        }

        // 進捗イベント送信（10件ごと or 最後）
        if ((i + 1) % PROGRESS_INTERVAL === 0 || i + 1 === total) {
          await sendEvent({
            type: 'progress',
            current: i + 1,
            total,
            successCount,
            failCount,
          });
        }

        // クライアント切断検知 → ループ終了
        if (writerClosed) {
          console.log(`[import-contacts] Client disconnected at (${i + 1}/${total}). Stopping.`);
          break;
        }

        // スロットリング
        const elapsed = Date.now() - loopStart;
        if (elapsed < THROTTLE_MS && i < total - 1) {
          await sleep(THROTTLE_MS - elapsed);
        }
      }

      console.log(`[import-contacts] Import completed: ${successCount} success, ${failCount} failed / ${total} total`);

      // 完了イベント
      await sendEvent({
        type: 'complete',
        total,
        successCount,
        failCount,
        failures,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await sendEvent({ type: 'error', message });
    } finally {
      if (!writerClosed) {
        try {
          await writer.close();
        } catch {
          // Stream already closed (client disconnected)
        }
      }
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
