import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * mail.tsx → mail.html 変換スクリプト
 *
 * 使用方法:
 *   npx tsx src/scripts/generate-mail-html.ts <mailTsxPath> <outputHtmlPath>
 *
 * 例:
 *   npx tsx src/scripts/generate-mail-html.ts src/archives/2026/01/20-test/mail.tsx src/archives/2026/01/20-test/mail.html
 */

async function generateMailHtml(mailTsxPath: string, outputHtmlPath: string): Promise<void> {
  try {
    // esbuild-register を使用して TypeScript を実行時にコンパイル
    const { register } = await import('esbuild-register/dist/node');
    register({ target: 'node18', format: 'cjs' });

    // requireのキャッシュをクリア
    const resolvedPath = path.resolve(mailTsxPath);
    delete require.cache[require.resolve(resolvedPath)];

    // mail.tsx を require で読み込み（MailContent 名前付きエクスポートを使用）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MailContent } = require(resolvedPath);

    if (!MailContent) {
      throw new Error('MailContent コンポーネントが見つかりません。export function MailContent() を確認してください。');
    }

    const MailComponent = MailContent;

    // @react-email/render で HTML に変換
    const { render } = await import('@react-email/render');
    const html = await render(MailComponent(), { plainText: false });

    // mail.html として保存
    fs.writeFileSync(outputHtmlPath, html, 'utf-8');

    console.log(`✓ mail.html 生成完了: ${outputHtmlPath}`);
  } catch (error) {
    console.error('mail.tsx の HTML 変換に失敗しました:', error);
    process.exit(1);
  }
}

// コマンドライン引数の取得
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('使用方法: npx tsx src/scripts/generate-mail-html.ts <mailTsxPath> <outputHtmlPath>');
  process.exit(1);
}

const [mailTsxPath, outputHtmlPath] = args;

// 実行
generateMailHtml(mailTsxPath, outputHtmlPath);
