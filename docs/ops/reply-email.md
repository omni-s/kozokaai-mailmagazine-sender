# メール返信機能ガイド

## 概要

受信者からの返信に対して、個別に返信メールを送信する機能です。Resend Emails API を使用して、`replyTo` ヘッダーを含む返信メールを送信します。

**ユースケース**:
- カスタマーサポート担当者が、受信メールに個別返信する
- 問い合わせに対して個別に対応する
- 月に数回程度の使用頻度を想定

---

## 前提条件

### 技術的制約

| 項目 | Emails API（返信機能で使用） | Broadcasts API（一斉配信で使用） |
|------|---------------------------|----------------------------|
| **replyTo パラメータ** | ✅ 対応 | ❌ 非対応 |
| **個別送信** | ✅ 可能 | ❌ 不可（Segment一斉送信のみ） |
| **スレッド機能** | ❌ 非対応（in_reply_to, references なし） | ❌ 非対応 |
| **使用ケース** | 個別のメール返信、トランザクションメール | マーケティング、ニュースレター一斉配信 |

### 重要な注意事項

1. **メールスレッド化**: Resend Emails API は `In-Reply-To` や `References` ヘッダーを明示的にサポートしていないため、メールクライアント上でスレッド化されない可能性があります。
2. **件名に "Re:" を付ける**: スレッド化を補完するため、件名に "Re:" プレフィックスを自動的に付けます。
3. **手動操作が必要**: 完全自動化された返信機能ではなく、担当者が手動で返信内容を入力します。

---

## 使用方法

### 1. スクリプト実行

```bash
pnpm run reply-email
```

### 2. 入力項目

スクリプトが対話形式で以下の項目を入力するように促します:

#### 2-1. 返信先メールアドレス

```
? 返信先メールアドレス: customer@example.com
```

**検証ルール**:
- メールアドレス形式（`name@domain.com`）であること
- 空白文字を含まないこと

#### 2-2. 元の件名

```
? 元の件名（自動的に "Re:" が付きます）: お問い合わせありがとうございます
```

**動作**:
- 入力した件名に自動的に "Re:" プレフィックスが付きます
- 既に "Re:" が付いている場合は、重複して付けません
- 例: `お問い合わせありがとうございます` → `Re: お問い合わせありがとうございます`

#### 2-3. 本文（HTML）

```
? 本文（HTML）:
```

**入力方法**:
- デフォルトのエディタ（通常は Vim、Nano、VS Code 等）が開きます
- HTML形式で本文を入力します
- 保存して閉じると、入力内容が反映されます

**HTML記述例**:
```html
<p>お問い合わせいただき、ありがとうございます。</p>
<p>以下の件について回答いたします。</p>
<ul>
  <li>ご質問1に対する回答</li>
  <li>ご質問2に対する回答</li>
</ul>
<p>引き続き、よろしくお願いいたします。</p>
```

### 3. 送信確認

入力が完了すると、以下の情報が表示されます:

```
送信中...

✓ 返信メール送信成功
  - メールID: re_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  - 送信先: customer@example.com
  - 件名: Re: お問い合わせありがとうございます
  - 送信元: newsletter@kozokaai.jp
  - 返信先: newsletter@kozokaai.jp
```

---

## 実装詳細

### ファイル構成

| ファイル | 説明 |
|---------|------|
| `src/scripts/send-reply-email.ts` | 返信メール送信スクリプト |
| `package.json` | `"reply-email"` コマンド定義 |

### コード実装

**送信処理**: `src/scripts/send-reply-email.ts` L73-79

```typescript
const { data, error } = await resend.emails.send({
  from: fromEmail,
  to: answers.to,
  subject: subject,
  replyTo: fromEmail, // 返信先アドレスを設定
  html: answers.body,
});
```

**重要なポイント**:
- `resend.emails.send()` を使用（`resend.broadcasts` ではない）
- `replyTo` パラメータで返信先アドレスを設定
- 個別送信のため、宛先は単一のメールアドレス

---

## トラブルシューティング

### 問題1: メールが送信されない

**症状**:
```
✗ 返信メール送信失敗: { message: '...' }
```

**原因と対処**:

1. **Resend API キーが無効**:
   - `.env` ファイルの `RESEND_API_KEY` を確認
   - Resend Dashboard で API キーが有効か確認

2. **送信元アドレスが検証されていない**:
   - `.env` ファイルの `RESEND_FROM_EMAIL` を確認
   - Resend Dashboard で送信元ドメインが検証済みか確認

3. **宛先メールアドレスが無効**:
   - 入力したメールアドレスの形式を確認
   - タイポや全角文字が含まれていないか確認

### 問題2: エディタが開かない

**症状**:
本文入力時にエディタが開かない、またはエラーが発生する

**原因と対処**:

1. **EDITOR 環境変数が未設定**:
   ```bash
   export EDITOR=nano
   # または
   export EDITOR=vim
   # または
   export EDITOR="code --wait"
   ```

2. **inquirer のエディタ機能が動作しない**:
   - 手動でHTML本文を別ファイルに保存してから、コマンドラインで貼り付ける方法を検討
   - または、スクリプトを修正して `type: 'input'` に変更

### 問題3: メールがスレッド化されない

**症状**:
返信メールが元のメールと別のスレッドに表示される

**原因**:
Resend Emails API が `In-Reply-To` や `References` ヘッダーをサポートしていないため

**対処**:
- 完全なスレッド化は技術的に不可能
- 件名に "Re:" が付いているため、視覚的に返信であることがわかる
- メールクライアントによっては、件名の一致でスレッド化される可能性もある

### 問題4: 受信者の返信先が間違っている

**症状**:
受信者が「返信」ボタンを押したときに、意図しないアドレスに返信される

**原因**:
`replyTo` パラメータが正しく設定されていない

**対処**:
- `src/scripts/send-reply-email.ts` L76 の `replyTo` パラメータを確認
- `.env` ファイルの `RESEND_FROM_EMAIL` を確認

---

## よくある質問（FAQ）

### Q1. Broadcast で送信したメールに対して返信できますか？

**A**: はい、可能です。Broadcast で送信したメールに返信が来た場合、このスクリプトを使用して個別に返信できます。

### Q2. 自動返信機能は実装できますか？

**A**: Resend 単体では不可能です。受信メール機能（Inbound Email）が Resend にないためです。自動返信を実装する場合は、Gmail API、SendGrid Inbound Parse、Amazon SES + Lambda 等の外部サービスとの統合が必要です。

### Q3. 複数の受信者に同じ返信を送ることはできますか？

**A**: 可能ですが、現在のスクリプトは単一の宛先のみをサポートしています。複数の受信者に同じ返信を送る場合は、スクリプトを複数回実行するか、`to` パラメータを配列形式に変更する必要があります。

```typescript
// 複数宛先の例（スクリプト修正が必要）
const { data, error } = await resend.emails.send({
  from: fromEmail,
  to: ['customer1@example.com', 'customer2@example.com'],
  subject: subject,
  replyTo: fromEmail,
  html: answers.body,
});
```

### Q4. HTMLではなくプレーンテキストで返信したい場合は？

**A**: `html` パラメータの代わりに `text` パラメータを使用します。スクリプトを以下のように修正してください:

```typescript
const { data, error } = await resend.emails.send({
  from: fromEmail,
  to: answers.to,
  subject: subject,
  replyTo: fromEmail,
  text: answers.body, // html の代わりに text を使用
});
```

### Q5. React コンポーネントを使って返信メールをデザインできますか？

**A**: 可能です。`react` パラメータを使用します:

```typescript
import { EmailWrapper } from '@/components/email/EmailWrapper';
import { render } from '@react-email/render';

const emailComponent = (
  <EmailWrapper previewText="お問い合わせへの返信">
    <p>お問い合わせいただき、ありがとうございます。</p>
  </EmailWrapper>
);

const html = await render(emailComponent, { plainText: false });

const { data, error } = await resend.emails.send({
  from: fromEmail,
  to: answers.to,
  subject: subject,
  replyTo: fromEmail,
  html,
});
```

---

## 関連ドキュメント

- **[workflow.md](./workflow.md)** - 日常的なメール配信フロー
- **[troubleshooting.md](./troubleshooting.md)** - トラブルシューティング
- **[CLAUDE.md](../../CLAUDE.md)** - 開発コマンドリファレンス

---

## 実装履歴

- **2026-01-21**: 初回実装
  - Resend Emails API を使用した個別返信機能
  - 対話型CLI（inquirer）による入力インターフェース
  - 件名に "Re:" プレフィックス自動追加
  - `replyTo` パラメータによる返信先アドレス設定

---

最終更新日: 2026-01-21
