import { z } from 'zod';

/**
 * コンタクトインポート API 用 Zod スキーマ
 *
 * Web UI から送信されるリクエストのバリデーションに使用
 */

/** カスタムプロパティ設定 */
export const PropertyConfigSchema = z.object({
  /** CSVカラム名 */
  columnName: z.string(),
  /** Resend Property キー */
  key: z.string(),
  /** 型（string or number） */
  type: z.enum(['string', 'number']),
  /** fallback値 */
  fallbackValue: z.union([z.string(), z.number(), z.null()]),
});

export type PropertyConfig = z.infer<typeof PropertyConfigSchema>;

/** カラム解析結果（JSON変換用） */
export const ColumnAnalysisJsonSchema = z.object({
  /** 標準フィールドのマッピング（CSVカラム名 → 標準フィールド名） */
  standard: z.array(z.tuple([z.string(), z.enum(['email', 'firstName', 'lastName', 'unsubscribed'])])),
  /** カスタムプロパティとして扱うカラム名一覧 */
  custom: z.array(z.string()),
  /** emailカラムのCSV上の名前 */
  emailColumn: z.string().nullable(),
});

export type ColumnAnalysisJson = z.infer<typeof ColumnAnalysisJsonSchema>;

/** インポート実行リクエスト */
export const ImportContactsRequestSchema = z.object({
  /** CSVレコード */
  records: z.array(z.record(z.string(), z.string())),
  /** Resend Audience ID */
  audienceId: z.string().uuid(),
  /** カスタムプロパティ設定 */
  propertyConfigs: z.array(PropertyConfigSchema),
  /** カラム解析結果 */
  columnAnalysis: ColumnAnalysisJsonSchema,
});

export type ImportContactsRequest = z.infer<typeof ImportContactsRequestSchema>;

/** SSE進捗イベント */
export interface ImportProgressEvent {
  type: 'progress';
  current: number;
  total: number;
  successCount: number;
  failCount: number;
}

/** SSE完了イベント */
export interface ImportCompleteEvent {
  type: 'complete';
  total: number;
  successCount: number;
  failCount: number;
  failures: Array<{ email: string; error: string }>;
}

/** SSEエラーイベント */
export interface ImportErrorEvent {
  type: 'error';
  message: string;
}

/** SSEイベント共用型 */
export type ImportEvent = ImportProgressEvent | ImportCompleteEvent | ImportErrorEvent;
