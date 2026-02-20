import { z } from "zod";

/**
 * config.json スキーマ定義
 *
 * アーカイブディレクトリ内の config.json を検証するためのZodスキーマ
 */
export const ConfigSchema = z
  .object({
    /**
     * メール件名
     */
    subject: z.string().min(1, "メール件名は必須です"),

    /**
     * Resend Segment ID（推奨）
     * 形式: UUID v4 (例: a355a0bd-32fa-4ef4-b6d5-7341f702d35b)
     */
    segmentId: z
      .string()
      .uuid(
        "Segment IDの形式が不正です（例: a355a0bd-32fa-4ef4-b6d5-7341f702d35b）"
      )
      .optional(),

    /**
     * Resend Audience ID（非推奨、後方互換性のため残す）
     * 形式: aud_xxxxxxxx
     * @deprecated Use segmentId instead
     */
    audienceId: z
      .string()
      .regex(
        /^aud_[a-zA-Z0-9]+$/,
        "Audience IDの形式が不正です（例: aud_12345678）"
      )
      .optional(),

    /**
     * 予約配信日時（ISO 8601形式、UTC）
     * null: 即時配信
     * string: 予約配信（配信予定日時）
     */
    scheduledAt: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional(),

    /**
     * 送信日時（ISO 8601形式）
     * null: 未送信
     * string: 送信済み（送信日時）
     */
    sentAt: z.string().nullable(),

    /**
     * 配信ステータス
     * - pending: コミット直後（テスト未実施）
     * - tested: テスト配信済み（本番配信可能）
     * - delivered: 即時配信済み
     * - waiting-schedule-delivery: 予約配信待機中
     * - schedule-delivered: 予約配信済み
     *
     * 後方互換: 既存の config.json（status未定義）も通過する
     */
    status: z
      .enum([
        "pending",
        "tested",
        "delivered",
        "waiting-schedule-delivery",
        "schedule-delivered",
      ])
      .nullable()
      .optional(),
  })
  .refine((data) => data.segmentId || data.audienceId, {
    message: "segmentId または audienceId のいずれかは必須です",
    path: ["segmentId"],
  });

/**
 * Config型定義
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * 配信ステータス定数
 */
export const CONFIG_STATUS = {
  PENDING: 'pending',
  TESTED: 'tested',
  DELIVERED: 'delivered',
  WAITING_SCHEDULE: 'waiting-schedule-delivery',
  SCHEDULE_DELIVERED: 'schedule-delivered',
} as const;

export type ConfigStatus = typeof CONFIG_STATUS[keyof typeof CONFIG_STATUS];

/**
 * config.jsonのバリデーション関数
 *
 * @param data - バリデーション対象データ
 * @returns バリデーション結果
 */
export function validateConfig(data: unknown): {
  success: boolean;
  data?: Config;
  error?: z.ZodError;
} {
  const result = ConfigSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
