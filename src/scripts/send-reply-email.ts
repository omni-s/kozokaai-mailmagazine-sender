/**
 * Resend メール返信送信スクリプト
 *
 * 受信者からの返信に対して、個別に返信メールを送信するスクリプト。
 * Resend Emails API を使用して、replyTo ヘッダーを含む返信メールを送信します。
 *
 * 使用方法:
 *   pnpm run reply-email
 *
 * 入力項目:
 *   - 返信先メールアドレス
 *   - 元の件名（自動的に "Re:" が付きます）
 *   - 本文（HTML）
 */

import { resend } from '@/lib/resend';
import inquirer from 'inquirer';
import dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config();

/**
 * 返信メール送信メイン処理
 */
async function sendReplyEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  console.log('=== Resend メール返信送信 ===\n');

  // ユーザー入力を取得
  const answers = await inquirer.prompt([
    {
      name: 'to',
      message: '返信先メールアドレス:',
      type: 'input',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || '有効なメールアドレスを入力してください';
      },
    },
    {
      name: 'originalSubject',
      message: '元の件名（自動的に "Re:" が付きます）:',
      type: 'input',
      validate: (input: string) => {
        return input.trim().length > 0 || '件名を入力してください';
      },
    },
    {
      name: 'body',
      message: '本文（HTML）:',
      type: 'editor',
      validate: (input: string) => {
        return input.trim().length > 0 || '本文を入力してください';
      },
    },
  ]);

  // 件名に "Re:" を付ける（既に付いている場合は追加しない）
  const subject = answers.originalSubject.startsWith('Re:')
    ? answers.originalSubject
    : `Re: ${answers.originalSubject}`;

  console.log('\n送信中...\n');

  // Resend Emails API で個別送信
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: answers.to,
    subject: subject,
    replyTo: fromEmail, // 返信先アドレスを設定
    html: answers.body,
  });

  if (error) {
    console.error('✗ 返信メール送信失敗:', error);
    process.exit(1);
  }

  console.log('✓ 返信メール送信成功');
  console.log(`  - メールID: ${data?.id}`);
  console.log(`  - 送信先: ${answers.to}`);
  console.log(`  - 件名: ${subject}`);
  console.log(`  - 送信元: ${fromEmail}`);
  console.log(`  - 返信先: ${fromEmail}`);
}

// スクリプト実行
sendReplyEmail().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
