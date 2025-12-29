# トラブルシューティング

本ドキュメントでは、Resendメール配信システムでよく発生するエラーと対処法を説明します。

---

## 目次

1. [pnpm run commit エラー](#1-npm-run-commit-エラー)
2. [GitHub Actions エラー](#2-github-actions-エラー)
3. [画像が表示されない](#3-画像が表示されない)
4. [メールが届かない](#4-メールが届かない)
5. [config.json エラー](#5-configjson-エラー)

---

## 1. pnpm run commit エラー

### エラー: `draft/page.tsx が見つかりません`

**エラーメッセージ**:
```
Error: draft/page.tsx が見つかりません
```

**原因**: `src/app/draft/page.tsx` が存在しない

**対処法**:

#### 方法1: テンプレートから作成

```bash
# src/app/draft/page.tsx を作成
mkdir -p src/app/draft
code src/app/draft/page.tsx
```

以下の最小限のテンプレートを貼り付け:

```tsx
import { EmailWrapper } from '@/components/email/EmailWrapper';

export default function DraftMail() {
  return (
    <EmailWrapper previewText="メールのプレビューテキスト">
      <h1>メールタイトル</h1>
      <p>メール本文...</p>
    </EmailWrapper>
  );
}
```

#### 方法2: アーカイブから復元

```bash
# 過去のアーカイブからコピー
cp public/archives/2024/05/20-summer-sale/mail.tsx src/app/draft/page.tsx
```

---

### エラー: `template.tsx が見つかりません`

**エラーメッセージ**:
```
Error: template.tsx が見つかりません
```

**原因**: `src/app/draft/template.tsx` が存在しない（commit スクリプトがリセット用に参照）

**対処法**:

#### 方法1: テンプレートファイルを作成

```bash
# src/app/draft/template.tsx を作成
code src/app/draft/template.tsx
```

以下の初期テンプレートを貼り付け:

```tsx
import { EmailWrapper } from '@/components/email/EmailWrapper';

export default function DraftMail() {
  return (
    <EmailWrapper previewText="新しいメールマガジン">
      <h1>メールタイトル</h1>
      <p>ここに本文を書いてください...</p>
    </EmailWrapper>
  );
}
```

#### 方法2: commit.ts の実装を確認

`src/scripts/commit.ts` で `template.tsx` を参照している箇所を確認し、必要に応じて修正します。

---

### エラー: Git push 失敗

**エラーメッセージ**:
```
Error: Command failed: git push
fatal: Authentication failed
```

**原因1**: 認証エラー（SSH/HTTPS）

**対処法**:

```bash
# 現在の認証方法を確認
git remote -v

# SSHの場合: SSH鍵を再設定
ssh-add ~/.ssh/id_rsa

# HTTPSの場合: 認証情報を再入力
git config --global credential.helper store
git push  # 認証情報を入力
```

**原因2**: リモートブランチ競合

**対処法**:

```bash
# リモートの変更を取り込む
git pull --rebase

# 再度 pnpm run commit 実行
pnpm run commit
```

---

## 2. Next.js 16 ESLint 問題

### エラー: `Invalid project directory provided`

**エラーメッセージ**:
```
Error: Invalid project directory provided, no such directory: .../lint
Command failed: pnpm run lint
```

**原因**: Next.js 16 の `next lint` コマンドにバグがあり、プロジェクトディレクトリを正しく認識できない場合があります。

**対処法**:

#### 方法1: `.eslintrc.json` ファイルを作成

Next.js 16 では ESLint 設定ファイルが必要です。

```bash
# プロジェクトルートに .eslintrc.json を作成
code .eslintrc.json
```

以下の内容を貼り付け:

```json
{
  "extends": "next/core-web-vitals"
}
```

#### 方法2: `package.json` の lint スクリプトを変更

`next lint` の代わりに `eslint .` を直接実行します。

**package.json** の `scripts` セクションを編集:

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

**変更前**: `"lint": "next lint"`
**変更後**: `"lint": "eslint ."`

---

### よくある ESLint エラー

#### 未使用変数エラー

**エラーメッセージ**:
```
error 'PutObjectCommand' is defined but never used @typescript-eslint/no-unused-vars
```

**対処法**:

1. 該当ファイルを開く
   ```bash
   code src/lib/s3.ts
   ```

2. 未使用のインポートや変数を削除
   ```typescript
   // ❌ 削除前
   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

   // ✅ 削除後
   import { S3Client } from '@aws-sdk/client-s3';
   ```

3. 再度 lint 実行
   ```bash
   pnpm run lint
   ```

---

## 3. GitHub Actions エラー

### Check Workflow 失敗

#### ESLint エラー

**エラーメッセージ**:
```
Error: ESLint found 5 errors
```

**対処法**:

```bash
# ローカルでESLint実行
pnpm run lint

# エラー内容を確認
# 例: Unexpected console statement (no-console)
#     Missing semicolon (semi)

# 自動修正を試す
pnpm run lint -- --fix

# 手動修正が必要な場合はエディタで修正
code src/app/draft/page.tsx
```

**よくあるESLintエラー**:

| エラー | 原因 | 対処 |
|-------|------|------|
| `no-console` | `console.log` 使用 | 削除 or `// eslint-disable-next-line no-console` |
| `@typescript-eslint/no-unused-vars` | 未使用変数 | 変数を削除 or 使用 |
| `react/jsx-key` | リストに `key` プロパティなし | `key={index}` 追加 |

---

#### TypeCheck エラー

**エラーメッセージ**:
```
Error: Type 'string' is not assignable to type 'number'
```

**対処法**:

```bash
# ローカルでTypeCheck実行
pnpm run type-check

# エラー内容を確認
# 例: src/app/draft/page.tsx:15:7
#     Type 'string' is not assignable to type 'number'

# エディタでエラー箇所を修正
code src/app/draft/page.tsx
```

**よくあるTypeScriptエラー**:

| エラー | 原因 | 対処 |
|-------|------|------|
| `Type 'string' is not assignable to type 'number'` | 型の不一致 | 変数の型を修正 |
| `Property 'xxx' does not exist on type 'yyy'` | 存在しないプロパティ参照 | プロパティ名を修正 |
| `Cannot find module '@/...'` | パスエイリアス設定ミス | `tsconfig.json` の `paths` 確認 |

---

#### Build エラー

**エラーメッセージ**:
```
Error: Build failed with 1 error
```

**対処法**:

```bash
# ローカルでビルド実行
pnpm run build

# エラーログを確認
# 例: Module not found: Can't resolve '@/components/...'

# node_modules を再インストール
rm -rf node_modules package-lock.json
pnpm install

# 再度ビルド
pnpm run build
```

**よくあるBuildエラー**:

| エラー | 原因 | 対処 |
|-------|------|------|
| `Module not found` | インポートパスミス | パスを修正 |
| `Unexpected token` | 構文エラー | コードを修正 |
| `Out of memory` | メモリ不足 | `NODE_OPTIONS=--max-old-space-size=4096 pnpm run build` |

---

#### Validation 失敗

**エラーメッセージ**:
```
Error: Validation failed: config.json schema error
```

**config.json スキーマエラー**:

| エラー | 原因 | 対処 |
|-------|------|------|
| `subject: String must contain at least 1 character(s)` | 件名が空文字 | `pnpm run commit` で件名を入力 |
| `audienceId: Invalid segment ID format` | Segment ID形式不正 | Resend Dashboard から正しいSegment IDをコピー（`seg_{uuid}`またはUUID形式） |
| `sentAt: Expected string, received null` | 通常は問題なし | 送信後に自動更新される |

**画像パスエラー**:

**エラーメッセージ**:
```
Error: Image path not found: /mail-assets/hero.png
```

**対処法**:

1. `mail.tsx` 内の `<Img src="/mail-assets/hero.png" />` 確認
2. `assets/hero.png` が実在するか確認
3. ファイル名の大文字小文字一致確認（Linux環境は厳密）

**Segment ID不正**:

**エラーメッセージ**:
```
Error: Segment ID not found: aud_invalid
```

**対処法**:

1. [Resend Dashboard](https://resend.com/segments) でSegment ID確認
2. `public/archives/{YYYY}/{MM}/{DD-MSG}/config.json` の `audienceId` フィールドに正しいSegment IDを設定
3. Segment ID形式: `seg_{uuid}` または UUID形式（例: `a355a0bd-32fa-4ef4-b6d5-7341f702d35b`）
4. Git commit & push

---

### Staging Workflow 失敗

#### S3アップロードエラー

**エラーメッセージ**:
```
Error: Access Denied (S3)
```

**対処法**:

1. **GitHub Secrets 確認**
   - Settings → Secrets and variables → Actions
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` が正しいか確認

2. **IAMユーザーのポリシー確認**
   - AWS IAM → ユーザー → アタッチされたポリシー
   - 必要な権限: `s3:PutObject`, `s3:PutObjectAcl`

3. **S3バケットのパブリックアクセス設定確認**
   - S3 → バケット → アクセス許可
   - パブリックアクセスのブロックがすべてオフか確認

---

#### テストメール送信失敗

**エラーメッセージ**:
```
Error: API key is invalid (Resend)
```

**原因1**: Resend APIキー無効

**対処法**:

1. [Resend Dashboard](https://resend.com/api-keys) で新しいAPIキーを発行
2. GitHub Secrets の `RESEND_API_KEY` を更新
3. ワークフロー再実行

**原因2**: REVIEWER_EMAIL 未設定

**エラーメッセージ**:
```
Error: REVIEWER_EMAIL environment variable is not set
```

**対処法**:

1. Settings → Secrets and variables → Actions
2. `REVIEWER_EMAIL` を追加（例: `reviewer@example.com`）

**原因3**: From Email未検証

**エラーメッセージ**:
```
Error: From email is not verified
```

**対処法**:

1. [Resend Dashboard](https://resend.com/domains) でドメイン検証ステータス確認
2. DNS設定（SPF, DKIM, DMARC）が正しいか確認
3. または `RESEND_FROM_EMAIL` を `onboarding@resend.dev` に変更（テスト用）

---

### Production Workflow 失敗

#### Manual Approval タイムアウト

**エラーメッセージ**:
```
Error: Deployment timeout (30 minutes)
```

**原因**: 承認期限（Wait timer）超過

**対処法**:

1. ワークフロー再実行
   - Actions → Production - Send Email → 失敗したRun
   - 右上の **Re-run jobs** → **Re-run all jobs**

2. 承認を迅速に実施（承認待機時間を短縮）

---

#### 本番配信エラー

**エラーメッセージ**:
```
Error: Segment not found
```

**対処法**:

1. [Resend Dashboard](https://resend.com/segments) で Segment 作成
2. Segment ID を `config.json` の `audienceId` フィールドに反映
3. Segment ID形式: `seg_{uuid}` または UUID形式
4. Git commit & push

**エラーメッセージ**:
```
Error: You have exceeded your sending quota
```

**原因**: Resend API クォータ超過

**対処法**:

1. [Resend Dashboard](https://resend.com/settings/billing) でプラン確認
2. 送信上限引き上げ（プランアップグレード）

**エラーメッセージ**:
```
Error: Failed to send email (status code: 400)
```

**対処法**:

1. Resend Dashboard のエラーログ確認
2. エラーコードに応じた対処法参照

---

#### sentAt 更新失敗

**エラーメッセージ**:
```
Error: Resource not accessible by integration
```

**原因**: Git権限、GITHUB_TOKEN設定

**対処法**:

1. **Workflow Permissions 確認**
   - Settings → Actions → General → Workflow permissions
   - ☑ **Read and write permissions** を選択
   - **Save** をクリック

2. **production.yml の GITHUB_TOKEN 確認**
   - `.github/workflows/production.yml` の 37-52行目確認
   - `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` が正しく設定されているか

---

## 3. 画像が表示されない

### ローカル開発時

**症状**: http://localhost:3000/draft で画像が表示されない

**対処法**:

1. **パス確認**
   ```tsx
   // ❌ 間違い: 先頭スラッシュなし
   <Img src="mail-assets/hero.png" />

   // ✅ 正しい: 先頭スラッシュあり
   <Img src="/mail-assets/hero.png" />
   ```

2. **ファイル存在確認**
   ```bash
   ls -la public/mail-assets/hero.png
   ```

3. **ファイル名の大文字小文字一致確認**
   - macOS: 大文字小文字不一致でも動作（`Hero.png` vs `hero.png`）
   - Linux: 厳密に一致必須

---

### テストメール

**症状**: テストメールで画像が表示されない

**対処法**:

1. **S3アップロード成功確認**
   - GitHub Actions → Staging Workflow → upload-to-s3 ステップのログ確認
   - `✓ Uploaded: archives/.../hero.png` が表示されているか

2. **S3バケットのパブリックアクセス設定確認**
   - S3 → バケット → アクセス許可
   - パブリックアクセスのブロックがすべてオフか確認

3. **ブラウザで S3 URL 直接アクセステスト**
   ```
   https://bucket.s3.region.amazonaws.com/archives/2024/05/20-summer-sale/assets/hero.png
   ```
   - ブラウザで開いて画像が表示されればOK
   - 403 Forbidden の場合: バケットポリシー確認

---

### 本番メール

**症状**: 本番メールで画像が表示されない

**対処法**:

1. **S3 URLの形式確認**
   ```
   https://{bucket}.s3.{region}.amazonaws.com/archives/{YYYY}/{MM}/{DD-MSG}/assets/{filename}
   ```

2. **CORS設定確認**
   - S3 → バケット → アクセス許可 → CORS
   - 以下の設定が存在するか確認
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET"],
       "AllowedOrigins": ["*"]
     }
   ]
   ```

3. **S3バケットのオブジェクト存在確認**
   - S3 → バケット → オブジェクト
   - `archives/2024/05/20-summer-sale/assets/hero.png` が存在するか確認

---

## 4. メールが届かない

### Resend Dashboard でエラーログ確認

1. [Resend Dashboard](https://resend.com/emails) にアクセス
2. **Emails** タブで該当送信ID → Status, Error Message 確認

**Status一覧**:

| Status | 意味 | 対処 |
|--------|------|------|
| `delivered` | 配信成功 | 問題なし |
| `bounced` | バウンス（メールアドレス不正） | Segment 内のアドレスを確認 |
| `failed` | 送信失敗 | エラーログ確認、APIキー確認 |
| `rejected` | 拒否（スパム判定等） | From Email検証、内容確認 |

---

### Segment ID の存在確認

**対処法**:

1. **Dashboard で確認**
   - [Resend Dashboard](https://resend.com/segments) → 該当 Segment 存在確認

2. **API経由で確認**
   ```bash
   npx tsx -e "import { resend } from './src/lib/resend.js'; resend.segments.list().then(console.log)"
   ```

---

### 送信元メールアドレス検証状態確認

**対処法**:

1. **Dashboard で確認**
   - [Resend Dashboard](https://resend.com/domains) → ドメイン検証ステータス確認
   - SPF, DKIM, DMARC すべて緑色のチェックマークか確認

2. **未検証の場合**
   - `onboarding@resend.dev` を使用（テスト用）
   - または DNS設定を完了させる

---

### スパムフィルタ、迷惑メールフォルダ確認

**対処法**:

1. **受信者のメールボックス確認**
   - 迷惑メールフォルダ
   - プロモーションタブ（Gmail）
   - ソーシャルタブ（Gmail）

2. **SPF/DKIM/DMARC設定の最適化**
   - Resend Dashboard でDNS設定ステータス確認
   - すべて緑色のチェックマークになるまで設定

---

## 5. config.json エラー

### Zodスキーマエラーの解読方法

#### エラー例1: `subject` が空文字

**エラーメッセージ**:
```
subject: String must contain at least 1 character(s)
```

**意味**: `subject` が空文字

**対処**:

```bash
# config.json を編集
code public/archives/2024/05/20-summer-sale/config.json
```

```json
{
  "subject": "【夏季限定】特別セール開催のお知らせ",  // ← 1文字以上入力
  "audienceId": "aud_abc123...",
  "sentAt": null
}
```

---

#### エラー例2: `audienceId` 形式エラー

**エラーメッセージ**:
```
audienceId: Invalid segment ID format
```

**意味**: Segment ID の形式が不正

**対処**:

1. Resend Dashboard から正しい Segment ID をコピー
2. `config.json` を修正

```json
{
  "subject": "【夏季限定】特別セール開催のお知らせ",
  "audienceId": "seg_abc123-def456-ghi789",  // ← seg_ で始まる、またはUUID形式
  "sentAt": null
}
```

⚠️ **注意**: フィールド名は `audienceId` ですが、値はSegment IDを設定します。

---

#### エラー例3: `sentAt` 型エラー

**エラーメッセージ**:
```
sentAt: Expected string, received null
```

**意味**: `sentAt` が null（未送信状態）だが、スキーマが文字列を期待

**対処**: 通常は問題なし（送信後に自動更新される）

配信後は以下の形式になります:

```json
{
  "subject": "【夏季限定】特別セール開催のお知らせ",
  "audienceId": "seg_abc123-def456-ghi789",
  "sentAt": "2024-05-20T10:30:00.000Z"  // ← ISO 8601形式
}
```

---

## よくある質問

### Q1: 同じメールを再送信できますか？

**A**: はい、可能です。

1. `config.json` の `sentAt` を `null` に戻す
2. Git commit & push
3. PRマージ → Manual Approval → 本番送信

⚠️ **注意**: 重複配信になるため、Audienceメンバーは同じメールを2回受け取ります。

---

### Q2: テスト送信をスキップして本番配信できますか？

**A**: はい、可能です（非推奨）。

mainブランチに直接pushすることでStaging Workflowをスキップできますが、**レビュープロセスを経ないため、誤送信リスクが高まります**。

**推奨**: feature ブランチでPR作成 → Staging でテスト送信 → 承認 → 本番配信

---

### Q3: 配信後に内容を修正できますか？

**A**: いいえ、送信済みメールは修正できません。

**対処法**:
- 訂正メールを新規作成して送信
- 件名に `【訂正】` を追加

---

## 関連ドキュメント

- **システムアーキテクチャ**: [docs/specs/architecture.md](../specs/architecture.md)
- **環境構築ガイド**: [docs/setup/environment.md](../setup/environment.md)
- **運用ガイド**: [docs/ops/workflow.md](./workflow.md)

---

最終更新日: 2025-12-29
