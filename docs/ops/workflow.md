# 日常的なメール配信フロー

本ドキュメントでは、Resendメール配信システムの日常的な運用フローを説明します。

---

## 配信フロー全体図

```
┌────────────────────┐
│ ステップ1:          │
│ ローカル制作        │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ ステップ2:          │
│ アーカイブ & コミット│
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ ステップ3:          │
│ レビューフェーズ    │
│ (feature ブランチ)  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ ステップ4:          │
│ 承認 & 本番配信     │
└────────────────────┘
```

---

## ステップ1: ローカル制作フェーズ

### 1.1. 開発サーバー起動

```bash
pnpm run dev
```

ブラウザで http://localhost:3000 を開くと、ホーム画面が表示されます。

### 1.2. メールコンテンツ作成

**編集対象**: `src/app/draft/page.tsx`

```tsx
import { EmailWrapper } from '@/components/email/EmailWrapper';
import { Img } from '@/components/email/Img';

export default function DraftMail() {
  return (
    <EmailWrapper previewText="【夏季限定】特別セール開催のお知らせ">
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
        【夏季限定】特別セール開催のお知らせ
      </h1>

      <Img
        src="/mail-assets/hero.png"
        alt="夏季セールのバナー"
        width={600}
        height={400}
      />

      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
        いつもご利用いただき、ありがとうございます。
      </p>

      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
        この度、夏季限定の特別セールを開催いたします。
        この機会にぜひお買い求めください。
      </p>

      <a
        href="https://example.com/sale"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: '4px',
          marginTop: '16px',
        }}
      >
        セールページを見る
      </a>
    </EmailWrapper>
  );
}
```

### 1.3. 画像配置

画像ファイルは `public/mail-assets/` 配下に配置します。

```bash
# 画像をコピー
cp ~/Downloads/hero.png public/mail-assets/
```

**サポートされる画像形式**: PNG, JPG, GIF, SVG

### 1.4. プレビュー確認

http://localhost:3000/draft にアクセスし、メールのプレビューを確認します。

**確認ポイント**:
- レイアウトが崩れていないか
- 画像が正しく表示されているか
- リンクが機能するか
- フォント・色が意図通りか

### 1.5. Next.js Hot Reloadの活用

`src/app/draft/page.tsx` を保存すると、ブラウザが自動的にリロードされます。編集とプレビューを繰り返しながらデザインを調整してください。

---

## ステップ2: アーカイブ & コミット

### 2.1. pnpm run commit 実行

制作が完了したら、以下のコマンドを実行します。

```bash
pnpm run commit
```

### 2.2. 対話型入力

#### 質問1: コミットメッセージ

```
? コミットメッセージ（英数字、ハイフン）: summer-sale
```

**用途**: アーカイブディレクトリ名の一部（`DD-MSG` の `MSG` 部分）

**命名規則**:
- 英数字とハイフン（`-`）のみ
- 簡潔でわかりやすい名前
- 例: `summer-sale`, `new-product`, `campaign-20250120`

#### 質問2: メール件名

```
? メール件名: 【夏季限定】特別セール開催のお知らせ
```

**用途**: `config.json` の `subject` フィールド（実際の配信件名）

**命名規則**:
- 日本語OK
- 空文字は不可（Zodスキーマでエラー）
- 50文字以内推奨（メーラーの表示幅）

#### 質問3: Resend Audience ID

```
? Resend Audience ID: aud_abc123-def456-ghi789
```

**用途**: `config.json` の `audienceId` フィールド（配信先リスト）

**取得方法**:
1. [Resend Dashboard](https://resend.com/audiences) にアクセス
2. 配信先Audienceをクリック
3. Audience IDをコピー（`aud_` で始まる文字列）

**検証**:
- 形式: `aud_{uuid}` （正規表現検証）
- 存在確認: Check Workflowで Resend API を呼び出し

### 2.3. 自動処理

以下の処理が自動的に実行されます。

#### 2.3.1. 日付取得

現在日時を `YYYY/MM/DD` 形式で取得します。

**例**: `2024/05/20`

#### 2.3.2. アーカイブディレクトリ作成

```
public/archives/2024/05/20-summer-sale/
```

**構造**:
```
public/archives/
└── 2024/
    └── 05/
        └── 20-summer-sale/
            ├── mail.tsx
            ├── assets/
            │   └── hero.png
            └── config.json
```

#### 2.3.3. ファイル移動

- `src/app/draft/page.tsx` → `archives/2024/05/20-summer-sale/mail.tsx`
- `public/mail-assets/*` → `archives/2024/05/20-summer-sale/assets/`

#### 2.3.4. config.json 生成

```json
{
  "subject": "【夏季限定】特別セール開催のお知らせ",
  "audienceId": "aud_abc123-def456-ghi789",
  "sentAt": null
}
```

#### 2.3.5. draft/page.tsx リセット

`src/app/draft/page.tsx` が初期テンプレートにリセットされます。

#### 2.3.6. Git操作

```bash
git add .
git commit -m "MAIL: Add summer-sale campaign"
git push
```

### 2.4. GitHub Actions Check Workflow 起動確認

GitHub リポジトリの **Actions** タブで、Check Workflowが起動したことを確認します。

**ジョブ内容**:
- ESLint
- TypeScript型チェック
- Next.js Build
- Archive Validation（config.json, 画像パス, Audience ID）

すべて成功すればOKです。

---

## ステップ3: レビューフェーズ（feature ブランチの場合）

### 3.1. GitHub でPR作成

feature ブランチで作業している場合、PRを作成します。

1. GitHubリポジトリページ → **Pull requests** タブ
2. **New pull request** をクリック
3. **base**: `main`, **compare**: `feature/summer-sale` を選択
4. **Create pull request** をクリック

### 3.2. Check Workflow 結果確認

PR作成後、Check Workflowが自動実行されます。

**確認項目**:
- ✅ ESLint: エラーなし
- ✅ TypeScript: 型エラーなし
- ✅ Build: ビルド成功
- ✅ Validate Archive: config.json, 画像パス, Audience ID 全てOK

### 3.3. Staging Workflow 自動起動

PRが作成されると、Staging Workflowが自動起動します。

**処理内容**:
1. **S3へ画像アップロード**
   - `archives/2024/05/20-summer-sale/assets/hero.png`
   - → `s3://bucket/archives/2024/05/20-summer-sale/assets/hero.png`

2. **レビュアーへテストメール送信**
   - 宛先: `REVIEWER_EMAIL`（GitHub Secrets）
   - 件名: `[TEST] 【夏季限定】特別セール開催のお知らせ`
   - 本文: React → HTML変換、画像パスをS3 URLに置換

### 3.4. レビュアーのメールボックスでデザイン確認

`REVIEWER_EMAIL` のメールボックスを開き、テストメールを確認します。

**確認ポイント**:
- レイアウトが崩れていないか
- 画像が正しく表示されているか（S3から読み込み）
- リンクが機能するか
- スマホ・デスクトップ両方で確認

### 3.5. 修正が必要な場合

デザイン修正が必要な場合:

1. **アーカイブ済みファイルを編集**
   ```bash
   # mail.tsx を編集
   code public/archives/2024/05/20-summer-sale/mail.tsx

   # 画像を差し替え
   cp ~/Downloads/hero_v2.png public/archives/2024/05/20-summer-sale/assets/hero.png
   ```

2. **Git commit & push**
   ```bash
   git add public/archives/2024/05/20-summer-sale/
   git commit -m "MAIL: Update summer-sale design"
   git push
   ```

3. **Staging Workflow 再実行**
   - PRへのpushで自動的に再実行される
   - 新しいテストメールが送信される

### 3.6. PR承認

デザインが完成したら、PRをレビューして承認します。

---

## ステップ4: 承認 & 本番配信

### 4.1. PRマージ

PR承認後、main ブランチへマージします。

1. PR画面で **Merge pull request** をクリック
2. **Confirm merge** をクリック

### 4.2. Production Workflow 起動

mainブランチへのマージで、Production Workflowが自動起動します。

**環境**: `production`（Manual Approval設定済み）

### 4.3. Manual Approval 画面で承認

1. GitHub リポジトリ → **Actions** タブ
2. **Production - Send Email** ワークフローをクリック
3. 実行中のRunをクリック
4. **"Waiting for review"** 表示を確認
5. **Review deployments** ボタンをクリック
6. ☑ `production` にチェック
7. コメント入力（オプション）
8. **Approve and deploy** ボタンをクリック

### 4.4. 本番メール送信実行

承認後、以下の処理が自動実行されます。

#### 4.4.1. React → HTML 変換

`archives/2024/05/20-summer-sale/mail.tsx` を HTML に変換します。

#### 4.4.2. 画像パス置換

```html
<!-- Before -->
<img src="/mail-assets/hero.png" />

<!-- After -->
<img src="https://bucket.s3.region.amazonaws.com/archives/2024/05/20-summer-sale/assets/hero.png" />
```

#### 4.4.3. Resend API で Audience一斉送信

```typescript
await resend.emails.send({
  from: RESEND_FROM_EMAIL,
  to: [{ audienceId: 'aud_abc123...' }],
  subject: '【夏季限定】特別セール開催のお知らせ',
  html: generatedHtml,
});
```

#### 4.4.4. config.json 更新

```json
{
  "subject": "【夏季限定】特別セール開催のお知らせ",
  "audienceId": "aud_abc123-def456-ghi789",
  "sentAt": "2024-05-20T10:30:00.000Z"
}
```

`sentAt` に送信日時（ISO 8601形式）が記録されます。

#### 4.4.5. Git commit & push

```bash
git add public/archives/**/config.json
git commit -m "MAIL: Update sentAt timestamps"
git push
```

### 4.5. 配信完了確認

#### Resend Dashboard で配信ログ確認

1. [Resend Dashboard](https://resend.com/emails) にアクセス
2. **Emails** タブで最新の送信を確認
3. **Status**: `delivered` を確認
4. **送信ID** をクリックして詳細確認

#### config.json の sentAt 確認

```bash
cat public/archives/2024/05/20-summer-sale/config.json
```

`sentAt` がnullから ISO 8601 形式のタイムスタンプに更新されていればOKです。

---

## ブランチ戦略との統合

### main ブランチ直接push の場合

**トリガー**:
- Check Workflow のみ実行
- Staging / Production Workflow は実行されない

**用途**:
- ドキュメント更新
- 緊急の修正（本番配信なし）

### feature ブランチ運用（推奨）

**フロー**:
1. feature ブランチ作成（例: `feature/summer-sale`）
2. `pnpm run commit` 実行
3. Git push → Check Workflow 実行
4. PR作成 → Staging Workflow 実行（テスト送信）
5. PR承認・マージ → Production Workflow 実行（Manual Approval → 本番送信）

**利点**:
- レビュープロセスの明確化
- Staging / Production の分離
- 誤送信リスクの軽減

**詳細**: `docs/dev/branch.md` 参照

---

## 緊急停止手順

### ワークフロー実行中の停止

1. GitHub リポジトリ → **Actions** タブ
2. 実行中のワークフローをクリック
3. 右上の **⋯** → **Cancel workflow** をクリック
4. 確認ダイアログで **Cancel** をクリック

### 送信済みメールのキャンセル

⚠️ **注意**: Resend API でメール送信が完了した後は、キャンセルできません。

**対処法**:
- フォローアップメール送信（訂正内容）
- 該当 Audience の一時停止（必要に応じて）

### 誤送信時の対処フロー

1. **影響範囲の確認**
   - Resend Dashboard で送信ログ確認
   - 何件送信されたか確認

2. **訂正メールの準備**
   - 誤送信の謝罪
   - 正しい情報の提供
   - 必要に応じて対応窓口の案内

3. **訂正メール送信**
   - 同じフローで訂正メールを制作
   - 件名に `【訂正】` を追加
   - 迅速に送信

---

## 配信履歴の確認方法

### アーカイブディレクトリ

すべての配信メールは `public/archives/` に保存されています。

```
public/archives/
├── 2024/
│   ├── 04/
│   │   └── 15-spring-campaign/
│   │       ├── mail.tsx
│   │       ├── assets/
│   │       └── config.json
│   └── 05/
│       └── 20-summer-sale/
│           ├── mail.tsx
│           ├── assets/
│           └── config.json
```

### config.json の sentAt フィールド

```bash
# 配信済みかどうか確認
cat public/archives/2024/05/20-summer-sale/config.json
```

**未配信**: `"sentAt": null`
**配信済み**: `"sentAt": "2024-05-20T10:30:00.000Z"`

### Resend Dashboard で配信ログ閲覧

1. [Resend Dashboard](https://resend.com/emails) にアクセス
2. **Emails** タブで配信履歴一覧表示
3. **フィルタ**: Status, Date Range, Audience 等で絞り込み可能
4. **送信ID** をクリックして詳細確認
   - 送信日時
   - 配信件数
   - エラーログ
   - バウンス率

---

## 日常的なチェックリスト

### ローカル制作時

- [ ] `pnpm run dev` で開発サーバー起動
- [ ] `src/app/draft/page.tsx` 編集
- [ ] 画像を `public/mail-assets/` に配置
- [ ] http://localhost:3000/draft でプレビュー確認
- [ ] レイアウト・画像・リンク・フォントをチェック

### アーカイブ時

- [ ] `pnpm run commit` 実行
- [ ] コミットメッセージ入力（英数字・ハイフン）
- [ ] メール件名入力（空文字不可）
- [ ] Resend Audience ID 入力（`aud_` で始まる）
- [ ] GitHub Actions Check Workflow 成功確認

### レビュー時

- [ ] PR作成（feature ブランチの場合）
- [ ] Check Workflow 成功確認
- [ ] Staging Workflow 成功確認
- [ ] `REVIEWER_EMAIL` でテストメール受信確認
- [ ] デザイン・画像・リンク・スマホ表示確認
- [ ] 必要に応じて修正・再送信

### 本番配信時

- [ ] PRマージ
- [ ] Production Workflow 起動確認
- [ ] Manual Approval 画面で承認
- [ ] 本番メール送信完了確認
- [ ] `config.json` の `sentAt` 更新確認
- [ ] Resend Dashboard で配信ログ確認

---

## 関連ドキュメント

- **システムアーキテクチャ**: [docs/specs/architecture.md](../specs/architecture.md)
- **環境構築ガイド**: [docs/setup/environment.md](../setup/environment.md)
- **トラブルシューティング**: [docs/ops/troubleshooting.md](./troubleshooting.md)
- **ブランチ戦略**: [docs/dev/branch.md](../dev/branch.md)

---

最終更新日: 2025-12-19
