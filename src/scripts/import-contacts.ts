import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { resend } from '../lib/resend';
import {
  parseCSV,
  analyzeColumns,
  toPropertyKey,
  parseBooleanValue,
  type StandardField,
} from '../lib/csv-parser';

/**
 * CSVからResend Contactインポート CLIスクリプト
 *
 * CSVファイルを読み込み、Resend Contact APIを使って
 * コンタクトを一括インポートする。
 * レート制限（2 req/sec）を考慮したスロットリング付き。
 */

// スロットリング設定
const THROTTLE_MS = 667; // ~1.5 req/sec（安全マージン）
const RETRY_WAIT_MS = 5000; // 429エラー時の待機時間
const MAX_RETRIES = 3; // 最大リトライ回数

/** カスタムプロパティの設定 */
interface PropertyConfig {
  /** CSVカラム名 */
  columnName: string;
  /** Resend Property キー */
  key: string;
  /** 型（string or number） */
  type: 'string' | 'number';
  /** fallback値 */
  fallbackValue: string | number | null;
}

/** インポート結果 */
interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

/**
 * 指定ミリ秒待機する
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * プログレスバーを表示する
 */
function displayProgress(
  current: number,
  total: number,
  successCount: number,
  failCount: number,
  startTime: number,
): void {
  const percent = Math.floor((current / total) * 100);
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = current / elapsed;
  const remaining = rate > 0 ? Math.ceil((total - current) / rate) : 0;

  process.stdout.write(
    `\r  [${percent}%] ${current.toLocaleString()}/${total.toLocaleString()} ` +
    chalk.green(`✓${successCount.toLocaleString()} `) +
    chalk.red(`✗${failCount.toLocaleString()} `) +
    chalk.gray(`残り: ~${remaining}s`)
  );
}

/**
 * 単一のコンタクトを作成する（リトライ付き）
 */
async function createContactWithRetry(
  audienceId: string,
  email: string,
  firstName: string | undefined,
  lastName: string | undefined,
  unsubscribed: boolean | undefined,
  properties: Record<string, string | number | null> | undefined,
  retries: number = 0,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.contacts.create({
      audienceId,
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      unsubscribed,
      properties: properties && Object.keys(properties).length > 0 ? properties : undefined,
    });

    if (error) {
      // 429 Rate Limit エラー
      if ('statusCode' in error && (error as { statusCode: number }).statusCode === 429) {
        if (retries < MAX_RETRIES) {
          await sleep(RETRY_WAIT_MS);
          return createContactWithRetry(
            audienceId, email, firstName, lastName, unsubscribed, properties, retries + 1
          );
        }
        return { success: false, error: `Rate limit exceeded (${MAX_RETRIES} retries exhausted)` };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // ネットワークエラー等でも429を検出
    if (message.includes('429') || message.includes('rate limit')) {
      if (retries < MAX_RETRIES) {
        await sleep(RETRY_WAIT_MS);
        return createContactWithRetry(
          audienceId, email, firstName, lastName, unsubscribed, properties, retries + 1
        );
      }
    }

    return { success: false, error: message };
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log(chalk.blue.bold('\n========================================'));
  console.log(chalk.blue.bold('  Resend CSV Contact インポーター'));
  console.log(chalk.blue.bold('========================================\n'));

  // -------------------------------------------------------
  // 1. CSVファイルパス入力
  // -------------------------------------------------------
  const { csvPath } = await inquirer.prompt<{ csvPath: string }>([
    {
      type: 'input',
      name: 'csvPath',
      message: 'CSVファイルのパスを入力してください:',
      validate: (input: string) => {
        const resolved = path.resolve(input.trim());
        if (!fs.existsSync(resolved)) {
          return `ファイルが見つかりません: ${resolved}`;
        }
        if (!resolved.toLowerCase().endsWith('.csv')) {
          return 'CSVファイル（.csv）を指定してください';
        }
        return true;
      },
    },
  ]);

  // -------------------------------------------------------
  // 2. CSV読み込み・パース
  // -------------------------------------------------------
  console.log(chalk.cyan('\nCSVファイルを読み込み中...'));

  let records: Record<string, string>[];
  try {
    const content = fs.readFileSync(path.resolve(csvPath.trim()), 'utf-8');
    records = parseCSV(content);
  } catch (err) {
    console.error(chalk.red(`CSVパースエラー: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }

  if (records.length === 0) {
    console.error(chalk.red('CSVにレコードがありません'));
    process.exit(1);
  }

  const headers = Object.keys(records[0]);
  console.log(chalk.green(`✓ ${records.length.toLocaleString()}件のレコードを検出\n`));

  // -------------------------------------------------------
  // 3. カラム検出・マッピング表示
  // -------------------------------------------------------
  const analysis = analyzeColumns(headers);

  if (!analysis.emailColumn) {
    console.error(chalk.red('エラー: emailカラムが見つかりません'));
    console.error(chalk.red('CSVに以下のいずれかのカラム名が必要です:'));
    console.error(chalk.red('  email, emailaddress, mail, Eメール, メールアドレス'));
    process.exit(1);
  }

  console.log(chalk.cyan('カラムマッピング:'));
  console.log(chalk.cyan('─'.repeat(50)));

  for (const [csvCol, field] of analysis.standard) {
    console.log(chalk.green(`  ${csvCol} → ${field}`));
  }

  if (analysis.custom.length > 0) {
    console.log(chalk.yellow(`\n  カスタムプロパティ候補: ${analysis.custom.length}件`));
    for (const col of analysis.custom) {
      console.log(chalk.yellow(`    - ${col}`));
    }
  }

  console.log();

  // -------------------------------------------------------
  // 4. Audience ID 入力
  // -------------------------------------------------------
  const { audienceId } = await inquirer.prompt<{ audienceId: string }>([
    {
      type: 'input',
      name: 'audienceId',
      message: 'Resend Audience ID (UUID形式):',
      validate: (input: string) => {
        const value = input.trim();
        if (!value) return 'Audience IDは必須です';
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          return 'UUID形式で入力してください（例: 78261eea-8f8b-4381-83c6-79fa7120f1cf）';
        }
        return true;
      },
    },
  ]);

  // -------------------------------------------------------
  // 5. カスタムプロパティ設定
  // -------------------------------------------------------
  const propertyConfigs: PropertyConfig[] = [];

  if (analysis.custom.length > 0) {
    console.log(chalk.cyan('\nカスタムプロパティの設定:'));
    console.log(chalk.gray('（各カラムについて型とfallback値を設定します）\n'));

    for (const columnName of analysis.custom) {
      // サンプル値を表示（最大3件）
      const samples = records
        .slice(0, 3)
        .map((r) => r[columnName])
        .filter((v) => v !== undefined && v !== '');

      console.log(chalk.cyan(`  カラム: ${columnName}`));
      if (samples.length > 0) {
        console.log(chalk.gray(`  サンプル値: ${samples.join(', ')}`));
      }

      const { includeProperty } = await inquirer.prompt<{ includeProperty: boolean }>([
        {
          type: 'confirm',
          name: 'includeProperty',
          message: `「${columnName}」をカスタムプロパティとしてインポートしますか？`,
          default: true,
        },
      ]);

      if (!includeProperty) {
        console.log(chalk.gray(`  → スキップ\n`));
        continue;
      }

      const key = toPropertyKey(columnName);

      const { propertyType } = await inquirer.prompt<{ propertyType: 'string' | 'number' }>([
        {
          type: 'list',
          name: 'propertyType',
          message: `「${columnName}」の型:`,
          choices: [
            { name: 'string（テキスト）', value: 'string' },
            { name: 'number（数値）', value: 'number' },
          ],
          default: 'string',
        },
      ]);

      const { fallbackInput } = await inquirer.prompt<{ fallbackInput: string }>([
        {
          type: 'input',
          name: 'fallbackInput',
          message: `「${columnName}」のfallback値（空欄でnull）:`,
          default: '',
        },
      ]);

      let fallbackValue: string | number | null = null;
      if (fallbackInput.trim() !== '') {
        if (propertyType === 'number') {
          const num = Number(fallbackInput.trim());
          if (isNaN(num)) {
            console.error(chalk.red(`  エラー: 数値型のfallback値に無効な値が指定されました: ${fallbackInput}`));
            process.exit(1);
          }
          fallbackValue = num;
        } else {
          fallbackValue = fallbackInput.trim();
        }
      }

      propertyConfigs.push({
        columnName,
        key,
        type: propertyType,
        fallbackValue,
      });

      console.log(chalk.green(`  → key: "${key}", type: ${propertyType}, fallback: ${fallbackValue ?? 'null'}\n`));
    }
  }

  // -------------------------------------------------------
  // 6. インポート確認画面
  // -------------------------------------------------------
  const estimatedSeconds = Math.ceil(records.length * (THROTTLE_MS / 1000));

  console.log(chalk.blue.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.blue.bold('  インポート確認'));
  console.log(chalk.blue.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(`  Audience ID:    ${audienceId}`);
  console.log(`  レコード数:     ${records.length.toLocaleString()}件`);
  console.log(`  推定所要時間:   約${Math.ceil(estimatedSeconds / 60)}分`);
  console.log();

  console.log('  マッピング:');
  for (const [csvCol, field] of analysis.standard) {
    console.log(`    ${csvCol} → ${field}`);
  }
  for (const config of propertyConfigs) {
    console.log(`    ${config.columnName} → properties.${config.key} (${config.type})`);
  }

  console.log();

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'インポートを開始しますか？',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('\n操作がキャンセルされました'));
    process.exit(0);
  }

  // -------------------------------------------------------
  // 7. カスタムプロパティ作成（Resend API）
  // -------------------------------------------------------
  if (propertyConfigs.length > 0) {
    console.log(chalk.cyan('\nカスタムプロパティを作成中...\n'));

    // 既存プロパティを取得
    let existingKeys: Set<string> = new Set();
    try {
      const { data: listData, error: listError } = await resend.contactProperties.list();
      if (listError) {
        console.error(chalk.red(`プロパティ一覧の取得に失敗: ${listError.message}`));
        process.exit(1);
      }
      if (listData?.data) {
        existingKeys = new Set(listData.data.map((p) => p.key));
      }
    } catch (err) {
      console.error(chalk.red(`プロパティ一覧の取得に失敗: ${err instanceof Error ? err.message : err}`));
      process.exit(1);
    }

    for (const config of propertyConfigs) {
      if (existingKeys.has(config.key)) {
        console.log(chalk.gray(`  ⊘ "${config.key}" は既に存在（スキップ）`));
        continue;
      }

      try {
        const createOptions = config.type === 'string'
          ? { key: config.key, type: 'string' as const, fallbackValue: config.fallbackValue as string | null | undefined }
          : { key: config.key, type: 'number' as const, fallbackValue: config.fallbackValue as number | null | undefined };

        const { error } = await resend.contactProperties.create(createOptions);

        if (error) {
          console.error(chalk.red(`  プロパティ "${config.key}" の作成に失敗: ${error.message}`));
          process.exit(1);
        }

        console.log(chalk.green(`  ✓ "${config.key}" を作成 (${config.type})`));
      } catch (err) {
        console.error(chalk.red(`  プロパティ "${config.key}" の作成に失敗: ${err instanceof Error ? err.message : err}`));
        process.exit(1);
      }
    }

    console.log();
  }

  // -------------------------------------------------------
  // 8. コンタクト作成（スロットリング付きループ）
  // -------------------------------------------------------
  console.log(chalk.cyan('コンタクトをインポート中...\n'));

  const results: ImportResult[] = [];
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  // 標準フィールドのマッピングを逆引きで準備
  const fieldToColumn = new Map<StandardField, string>();
  for (const [csvCol, field] of analysis.standard) {
    fieldToColumn.set(field, csvCol);
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const loopStart = Date.now();

    // email取得
    const email = record[analysis.emailColumn!]?.trim();
    if (!email) {
      results.push({ email: '(empty)', success: false, error: 'emailが空です' });
      failCount++;
      displayProgress(i + 1, records.length, successCount, failCount, startTime);
      continue;
    }

    // 標準フィールド取得
    const firstNameCol = fieldToColumn.get('firstName');
    const lastNameCol = fieldToColumn.get('lastName');
    const unsubscribedCol = fieldToColumn.get('unsubscribed');

    const firstName = firstNameCol ? record[firstNameCol]?.trim() || undefined : undefined;
    const lastName = lastNameCol ? record[lastNameCol]?.trim() || undefined : undefined;
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
          // 空の場合はfallback値を使用
          properties[config.key] = config.fallbackValue;
        } else if (config.type === 'number') {
          const num = Number(rawValue);
          properties[config.key] = isNaN(num) ? config.fallbackValue : num;
        } else {
          properties[config.key] = rawValue;
        }
      }
    }

    // API呼び出し
    const result = await createContactWithRetry(
      audienceId, email, firstName, lastName, unsubscribed, properties
    );

    if (result.success) {
      successCount++;
      results.push({ email, success: true });
    } else {
      failCount++;
      results.push({ email, success: false, error: result.error });
    }

    displayProgress(i + 1, records.length, successCount, failCount, startTime);

    // スロットリング
    const elapsed = Date.now() - loopStart;
    if (elapsed < THROTTLE_MS && i < records.length - 1) {
      await sleep(THROTTLE_MS - elapsed);
    }
  }

  // 改行（プログレスバーの後）
  console.log('\n');

  // -------------------------------------------------------
  // 9. 結果レポート
  // -------------------------------------------------------
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(chalk.blue.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.blue.bold('  インポート結果'));
  console.log(chalk.blue.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(`  合計:     ${records.length.toLocaleString()}件`);
  console.log(chalk.green(`  成功:     ${successCount.toLocaleString()}件`));
  console.log(chalk.red(`  失敗:     ${failCount.toLocaleString()}件`));
  console.log(`  所要時間: ${totalTime}秒\n`);

  // 失敗一覧
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log(chalk.red('失敗一覧:'));
    console.log(chalk.red('─'.repeat(50)));
    for (const f of failures) {
      console.log(chalk.red(`  ${f.email}: ${f.error}`));
    }
    console.log();
  }

  if (failCount === 0) {
    console.log(chalk.green.bold('✓ すべてのコンタクトを正常にインポートしました\n'));
  } else {
    console.log(chalk.yellow(`⚠ ${failCount}件のインポートに失敗しました\n`));
  }
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red('エラーが発生しました:'), error);
  process.exit(1);
});
