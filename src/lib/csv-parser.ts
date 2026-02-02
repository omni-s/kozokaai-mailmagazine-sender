import { parse as csvParse } from 'csv-parse/sync';

/**
 * CSV解析・カラムマッピングユーティリティ
 *
 * CSVファイルのヘッダーを正規化し、Resend Contact APIの標準フィールドにマッピングする。
 * 標準フィールドに該当しないカラムはカスタムプロパティとして扱う。
 */

/** Resend Contact の標準フィールド */
export type StandardField = 'email' | 'firstName' | 'lastName' | 'unsubscribed';

/** カラム解析結果 */
export interface ColumnAnalysis {
  /** 標準フィールドのマッピング（CSVカラム名 → 標準フィールド名） */
  standard: Map<string, StandardField>;
  /** カスタムプロパティとして扱うカラム名一覧 */
  custom: string[];
  /** emailカラムのCSV上の名前（nullの場合はemailカラムが見つからなかった） */
  emailColumn: string | null;
}

/**
 * 標準フィールドの正規化パターン
 * キー: 正規化後の文字列、値: マッピング先の標準フィールド名
 */
const STANDARD_FIELD_MAP: Record<string, StandardField> = {
  // email
  'email': 'email',
  'emailaddress': 'email',
  'mail': 'email',
  'eメール': 'email',
  'メールアドレス': 'email',
  // firstName
  'firstname': 'firstName',
  'first_name': 'firstName',
  'givenname': 'firstName',
  '名': 'firstName',
  '名前': 'firstName',
  // lastName
  'lastname': 'lastName',
  'last_name': 'lastName',
  'familyname': 'lastName',
  'surname': 'lastName',
  '姓': 'lastName',
  // unsubscribed
  'unsubscribed': 'unsubscribed',
  'unsubscribe': 'unsubscribed',
  'optedout': 'unsubscribed',
  'opted_out': 'unsubscribed',
};

/**
 * カラム名を正規化する
 * - 前後の空白を除去
 * - 小文字に変換
 * - 一般的なセパレータ（スペース、ハイフン、ドット）を除去
 *
 * @example
 * "First Name" → "firstname"
 * "E-mail" → "email"
 * "last.name" → "lastname"
 */
function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s\-\.]/g, '');
}

/**
 * CSVヘッダーを解析し、標準フィールドとカスタムプロパティに分類する
 *
 * @param headers - CSVのヘッダー行のカラム名配列
 * @returns カラム解析結果
 */
export function analyzeColumns(headers: string[]): ColumnAnalysis {
  const standard = new Map<string, StandardField>();
  const custom: string[] = [];
  let emailColumn: string | null = null;

  for (const header of headers) {
    const normalized = normalizeColumnName(header);
    const field = STANDARD_FIELD_MAP[normalized];

    if (field) {
      standard.set(header, field);
      if (field === 'email') {
        emailColumn = header;
      }
    } else {
      custom.push(header);
    }
  }

  return { standard, custom, emailColumn };
}

/**
 * カラム名をResend Contact Propertyのキーに変換する
 *
 * Resend APIの制約:
 * - 使用可能文字: [a-zA-Z0-9_]
 * - 最大長: 50文字
 *
 * @param name - 元のカラム名
 * @returns Resend準拠のプロパティキー
 */
export function toPropertyKey(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_\s]/g, '')  // 使用不可文字を除去
    .replace(/\s+/g, '_')              // スペースをアンダースコアに
    .replace(/_{2,}/g, '_')            // 連続アンダースコアを1つに
    .replace(/^_|_$/g, '')             // 先頭・末尾のアンダースコアを除去
    .substring(0, 50);                 // 最大50文字に切り詰め
}

/**
 * 文字列をboolean値に変換する
 *
 * 以下の値をtrueとして扱う（大文字小文字不問）:
 * "true", "yes", "1", "on"
 *
 * 以下の値をfalseとして扱う（大文字小文字不問）:
 * "false", "no", "0", "off", ""（空文字）
 *
 * @param value - 変換元の文字列
 * @returns boolean値
 */
export function parseBooleanValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return ['true', 'yes', '1', 'on'].includes(normalized);
}

/**
 * CSVファイルの内容をパースしてレコード配列として返す
 *
 * BOM（Byte Order Mark）を自動除去する。
 *
 * @param content - CSVファイルの内容（文字列）
 * @returns パース結果のレコード配列
 */
export function parseCSV(content: string): Record<string, string>[] {
  // BOM除去
  const cleanContent = content.replace(/^\uFEFF/, '');

  return csvParse(cleanContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}
