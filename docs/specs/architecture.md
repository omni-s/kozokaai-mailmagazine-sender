# システムアーキテクチャ概要

## 概要

本プロジェクトは、**Next.js + React Email + Resend API + AWS S3** を組み合わせた、メールマガジン配信システムです。

**主な特徴:**
- ローカルでReactコンポーネントとしてメールをデザイン
- Git + GitHub Actionsによる完全自動化されたCI/CDパイプライン
- S3による画像ホスティング + Resend APIによる一斉配信
- Manual Approvalによる誤送信防止機構

---

## システム全体フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                        ローカル制作フェーズ                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ pnpm run dev
                                 ▼
                    ┌──────────────────────┐
                    │ src/app/draft/       │
                    │   page.tsx           │
                    │                      │
                    │ 画像: public/        │
                    │   mail-assets/       │
                    └──────────────────────┘
                                 │
                                 │ pnpm run commit
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       アーカイブフェーズ                             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ public/archives/        │
                    │   YYYY/MM/DD-MSG/       │
                    │     ├── mail.tsx        │
                    │     ├── assets/         │
                    │     └── config.json     │
                    └─────────────────────────┘
                                 │
                                 │ git push
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    バリデーションフェーズ                            │
│                  (GitHub Actions: Check)                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ ✓ ESLint               │
                    │ ✓ TypeScript            │
                    │ ✓ Build                 │
                    │ ✓ Validate Archive      │
                    │   - config.json         │
                    │   - 画像パス             │
                    │   - Audience ID         │
                    └─────────────────────────┘
                                 │
                                 │ PR作成
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Stagingフェーズ                              │
│               (GitHub Actions: Staging)                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ 1. S3アップロード        │
                    │   assets/ → S3          │
                    │                         │
                    │ 2. テストメール送信      │
                    │   → REVIEWER_EMAIL      │
                    │   件名: [TEST] xxx      │
                    └─────────────────────────┘
                                 │
                                 │ PRマージ
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Productionフェーズ                            │
│              (GitHub Actions: Production)                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ Manual Approval         │
                    │ (承認待機)               │
                    └─────────────────────────┘
                                 │
                                 │ 承認ボタン押下
                                 ▼
                    ┌────────────┴────────────┐
                    │ 1. 本番メール送信        │
                    │   → Audience            │
                    │                         │
                    │ 2. config.json更新      │
                    │   sentAt: タイムスタンプ │
                    │                         │
                    │ 3. Git commit & push    │
                    └─────────────────────────┘
```

---

## 技術スタック

### フロントエンド・メール制作

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|---------|
| **Next.js** | 16.1.0 | フレームワーク | App Router、Turbopack、React Server Components、高速ビルド |
| **React** | 19.2.3 | UIライブラリ | メールテンプレートをReactコンポーネントとして管理 |
| **TypeScript** | 5.9.3 | 型安全性 | 開発体験向上、バグ防止 |
| **@react-email/render** | 2.0.0 | React → HTML変換 | Resend公式推奨、メールHTML生成、非同期API対応 |
| **@react-email/components** | latest | メール用コンポーネント | `<Img>`, `<Button>` 等、メールクライアント互換性 |
| **Tailwind CSS** | 4.1.18 | スタイリング | ユーティリティファースト、開発効率 |
| **ShadcnUI** | latest | UIコンポーネント | プレビュー画面のUI（メール本文には使用しない） |

### バックエンド・外部サービス

| 技術 | 用途 | 選定理由 |
|------|------|---------|
| **Resend API** | メール配信 | 開発者体験、Audience管理、配信ログ、React Email公式対応 |
| **AWS S3** | 画像ホスティング | 低コスト、高可用性、パブリックアクセス対応 |
| **GitHub Actions** | CI/CD | 無料枠、GitHub統合、Manual Approval機能 |

### CLI・スクリプティング

| 技術 | 用途 |
|------|------|
| **inquirer** | 対話型CLI（pnpm run commit） |
| **chalk** | ターミナル出力の色付け |
| **zod** | スキーマ検証（config.json） |
| **date-fns** | 日付フォーマット |
| **tsx** | TypeScript実行（スクリプト） |

### 選定の総合的な理由

1. **開発者体験**: Next.js Hot Reload + Reactコンポーネントでメールをローカルでプレビューしながら制作
2. **型安全性**: TypeScript + Zodでランタイムエラーを事前防止
3. **完全自動化**: GitHub Actionsで人的ミスを削減
4. **コスト効率**: S3（低コスト）+ Resend（開発者向けプラン）
5. **保守性**: アーカイブ構造でメール履歴を完全管理

---

## コンポーネント構成とデータフロー

### ディレクトリ構造

```
kozokaai-mailmagazine-sender/
├── src/
│   ├── app/
│   │   ├── draft/
│   │   │   └── page.tsx          # メール制作用テンプレート
│   │   ├── layout.tsx             # Next.js Root Layout
│   │   └── page.tsx               # ホーム画面
│   ├── components/
│   │   ├── email/
│   │   │   ├── EmailWrapper.tsx  # メール共通レイアウト
│   │   │   └── Img.tsx            # 画像パス解決コンポーネント
│   │   └── ui/                    # ShadcnUIコンポーネント
│   ├── lib/
│   │   ├── config-schema.ts       # Zodスキーマ定義
│   │   ├── resend.ts              # Resend SDK初期化
│   │   └── s3.ts                  # S3 Client初期化
│   └── scripts/
│       ├── commit.ts              # pnpm run commit（アーカイブ）
│       ├── validate-archive.ts    # Check Workflow
│       ├── upload-to-s3.ts        # Staging Workflow
│       ├── send-test-email.ts     # Staging Workflow
│       └── send-production-email.ts # Production Workflow
├── public/
│   ├── mail-assets/               # 制作中の画像
│   └── archives/                  # アーカイブ済みメール
│       └── YYYY/MM/DD-MSG/
│           ├── mail.tsx
│           ├── assets/
│           └── config.json
└── .github/
    └── workflows/
        ├── check.yml
        ├── staging.yml
        └── production.yml
```

### データフロー詳細

#### 1. ローカル制作 → アーカイブ

```
src/app/draft/page.tsx (編集中)
  ├── <EmailWrapper> (共通レイアウト)
  │     └── <Img src="/mail-assets/hero.png" /> (画像参照)
  └── <p>メール本文...</p>

           │
           │ pnpm run commit
           ▼

public/archives/2024/05/20-summer-sale/
  ├── mail.tsx (draft/page.tsx をコピー)
  ├── assets/
  │     └── hero.png (mail-assets/ から移動)
  └── config.json
        {
          "subject": "【夏季限定】特別セール",
          "audienceId": "aud_abc123...",
          "sentAt": null
        }
```

#### 2. バリデーション → S3アップロード

```
validate-archive.ts (Check Workflow)
  ├── config.json スキーマ検証
  ├── 画像パス検証 (<Img src> → assets/ 実在確認)
  └── Audience ID検証 (Resend API)

           │
           │ PR作成
           ▼

upload-to-s3.ts (Staging Workflow)
  └── archives/2024/05/20-summer-sale/assets/hero.png
        → s3://bucket/archives/2024/05/20-summer-sale/assets/hero.png
```

#### 3. テスト送信 → 本番送信

```
send-test-email.ts (Staging Workflow)
  ├── mail.tsx を React → HTML 変換
  ├── 画像パス置換
  │     /mail-assets/hero.png
  │       → https://bucket.s3.region.amazonaws.com/.../hero.png
  └── Resend API でテスト送信
        to: REVIEWER_EMAIL
        subject: "[TEST] 【夏季限定】特別セール"

           │
           │ PRマージ + Manual Approval
           ▼

send-production-email.ts (Production Workflow)
  ├── mail.tsx を React → HTML 変換
  ├── 画像パス置換 (同上)
  ├── Resend API で Audience一斉送信
  └── config.json 更新
        sentAt: "2024-05-20T10:30:00.000Z"
        Git commit & push
```

---

## 画像パス置換ロジック

### 問題

メール制作時に使用する画像パス（`/mail-assets/hero.png`）は、ローカル開発サーバーでのみ有効です。実際のメール配信では、S3にホスティングされた画像を参照する必要があります。

### 解決策

スクリプト側で **画像パスの置換** を自動実行します。

### 実装詳細

#### 開発時のパス（`src/app/draft/page.tsx`）

```tsx
import { Img } from '@/components/email/Img';

export default function DraftMail() {
  return (
    <EmailWrapper>
      <Img
        src="/mail-assets/hero.png"
        alt="Hero Image"
        width={600}
        height={400}
      />
    </EmailWrapper>
  );
}
```

#### アーカイブ時（`pnpm run commit`）

`public/archives/2024/05/20-summer-sale/mail.tsx` に移動（パス変更なし）

#### テスト送信・本番送信時（`send-test-email.ts`, `send-production-email.ts`）

**`replaceImagePaths()` 関数**（`src/scripts/send-test-email.ts` 124-137行目）:

```typescript
function replaceImagePaths(
  html: string,
  s3BaseUrl: string,
  yyyy: string,
  mm: string,
  ddMsg: string
): string {
  const pattern = /<Img[^>]*src=['"]\/mail-assets\/([^'"]+)['"]/g;

  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(/\/mail-assets\/[^'"]+/, s3Url);
  });
}
```

**置換結果**:

```html
<!-- Before -->
<img src="/mail-assets/hero.png" alt="Hero Image" width="600" height="400" />

<!-- After -->
<img src="https://bucket.s3.ap-northeast-1.amazonaws.com/archives/2024/05/20-summer-sale/assets/hero.png"
     alt="Hero Image" width="600" height="400" />
```

### 注意点

- **正規表現マッチング**: `<Img` タグの `src` 属性を検出
- **ファイル名の保持**: `hero.png` → `assets/hero.png` として S3 URL を生成
- **複数画像対応**: `replace()` の `g` フラグでグローバル置換

---

## メールHTML互換性設計

### 問題

一般的なWebページで使用される **modern CSS**（flexbox、grid、CSS-in-JS）は、多くのメールクライアント（Outlook、Gmail等）で **サポートされていません**。

### 解決策

**`<table>` タグ**でレイアウトを構築し、**インラインスタイル**を使用します。

### 実装: `EmailWrapper.tsx`

**ファイルパス**: `src/components/email/EmailWrapper.tsx`

#### テーブル構造

```
html
  └── body (背景色: #f6f9fc)
        └── <table> (外側テーブル: 100%幅)
              └── <tr>
                    └── <td align="center">
                          ├── <table> (内側テーブル: 600px固定幅)
                          │     └── メインコンテンツ
                          └── <table> (フッター: 600px固定幅)
                                └── フッターテキスト
```

#### コード例（抜粋）

```tsx
<table
  width="100%"
  cellPadding="0"
  cellSpacing="0"
  style={{
    margin: 0,
    padding: 0,
    backgroundColor: '#f6f9fc',
  }}
>
  <tr>
    <td align="center" style={{ padding: '40px 0' }}>
      <table
        width="600"
        cellPadding="0"
        cellSpacing="0"
        style={{
          maxWidth: '600px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <tr>
          <td style={{ padding: '40px' }}>{children}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### 設計のポイント

| 項目 | 実装方法 | 理由 |
|------|----------|------|
| **レイアウト** | `<table>`, `<tr>`, `<td>` | メールクライアント互換性 |
| **スタイル** | インラインスタイル（`style={{...}}`） | CSSクラス非対応クライアント対策 |
| **中央揃え** | `<td align="center">` | `margin: 0 auto` 非対応対策 |
| **最大幅** | `width="600"`, `maxWidth: '600px'` | デスクトップ・モバイル対応 |
| **背景色** | 外側テーブル `#f6f9fc` | 内側テーブル `#ffffff` でコントラスト |
| **パディング** | `padding: '40px'` | 読みやすさ確保 |

### プレビューテキスト

```tsx
{previewText && (
  <div
    style={{
      display: 'none',
      maxHeight: 0,
      overflow: 'hidden',
    }}
  >
    {previewText}
  </div>
)}
```

**機能**: メーラーの件名下に表示されるプレビューテキスト（Gmail、Outlook等）

---

## Resend Audience ID管理

### Audience IDとは

Resend APIでは、メール配信先のリストを **Audience**（オーディエンス）として管理します。各Audienceには固有のIDが付与されます。

**形式**: `aud_{uuid}`（例: `aud_abc123-def456-ghi789`）

### Zodスキーマによる検証

**ファイルパス**: `src/lib/config-schema.ts`

```typescript
import { z } from 'zod';

export const configSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  audienceId: z
    .string()
    .regex(/^aud_[a-zA-Z0-9_-]+$/, 'Invalid audience ID format'),
  sentAt: z.string().datetime().nullable(),
});

export type Config = z.infer<typeof configSchema>;

export function validateConfig(data: unknown) {
  return configSchema.safeParse(data);
}
```

### Resend API による存在確認

**ファイルパス**: `src/lib/resend.ts`

```typescript
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error('RESEND_API_KEY is not set');
}

export const resend = new Resend(apiKey);

export async function checkAudienceExists(
  audienceId: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await resend.audiences.get(audienceId);

    if (error) {
      return { exists: false, error: error.message };
    }

    return { exists: !!data, error: undefined };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function listAudiences() {
  return await resend.audiences.list();
}
```

### バリデーションのタイミング

**Check Workflow**（`.github/workflows/check.yml`）の `validate-archive` ステップで実行:

```yaml
- name: Validate archive
  run: npx tsx src/scripts/validate-archive.ts
  env:
    RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
```

**`validate-archive.ts` の処理**:

1. 新規 `archives/` ディレクトリ検出
2. `config.json` 読み込み
3. Zodスキーマ検証（形式チェック）
4. Resend API で Audience ID 存在確認
5. エラー時は詳細メッセージ出力、終了コード1

---

## sentAt タイムスタンプ管理

### 目的

- **配信履歴の追跡**: いつ配信したかを記録
- **重複配信防止**: すでに `sentAt` が記録されているメールは再配信しない

### データ形式

**ISO 8601形式**（例: `2024-05-20T10:30:00.000Z`）

```json
{
  "subject": "【夏季限定】特別セール開催のお知らせ",
  "audienceId": "aud_abc123...",
  "sentAt": "2024-05-20T10:30:00.000Z"
}
```

### 自動更新フロー

#### 初期状態（アーカイブ時）

`pnpm run commit` 実行時、`config.json` は `sentAt: null` で生成されます。

```json
{
  "subject": "【夏季限定】特別セール開催のお知らせ",
  "audienceId": "aud_abc123...",
  "sentAt": null
}
```

#### Production Workflow 実行時

**ファイルパス**: `src/scripts/send-production-email.ts`

```typescript
// 本番配信成功後
const sentAt = new Date().toISOString();

// config.json 更新
const updatedConfig = {
  ...config,
  sentAt,
};

fs.writeFileSync(
  configPath,
  JSON.stringify(updatedConfig, null, 2),
  'utf-8'
);
```

**Git commit & push**（`.github/workflows/production.yml` 37-52行目）:

```yaml
- name: Configure Git
  run: |
    git config --global user.name "GitHub Actions"
    git config --global user.email "actions@github.com"

- name: Push config.json updates
  run: |
    if git diff --quiet; then
      echo "No changes to commit"
    else
      git add public/archives/**/config.json
      git commit -m "MAIL: Update sentAt timestamps" || echo "No changes to commit"
      git push
    fi
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 確認方法

1. **ローカル**: `public/archives/{YYYY}/{MM}/{DD-MSG}/config.json` を開く
2. **GitHub**: リポジトリで該当ファイルの Commit History を確認
3. **Resend Dashboard**: Emails → 送信ID で配信ログ確認

---

## Manual Approval（二重チェック機構）

### 目的

**誤送信防止**: 本番配信前に人間が最終確認を行う仕組み

### 実装方法

**GitHub Environments** の **Protection Rules** を使用します。

### 設定手順

#### 1. Environments 作成

**GitHub リポジトリ → Settings → Environments → New environment**

- **Name**: `production`
- **Protection Rules**:
  - ☑ **Required reviewers**: 承認者を指定（例: リポジトリオーナー）
  - ⚠ **Wait timer**: オプション（例: 5分後に自動承認）

#### 2. Workflow への組み込み

**ファイルパス**: `.github/workflows/production.yml`

```yaml
jobs:
  production:
    name: Send Production Email
    runs-on: ubuntu-latest
    environment: production  # ← この行が重要

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      # ...
```

### 挙動

1. PR が main ブランチにマージ
2. Production Workflow 起動
3. **Workflow が一時停止** → 承認待機状態
4. GitHub Actions 画面に **"Review deployment"** ボタン表示
5. 承認者がボタン押下 → Workflow 再開
6. 本番メール送信実行

### 承認画面

**GitHub Actions → Production - Send Email → 該当Run**

```
Waiting for review
This workflow is waiting for approval to deploy to production.

[Review deployment]
```

### タイムアウト

- **Wait timer** 設定時: 指定時間経過後、自動承認または自動キャンセル（設定による）
- **未設定**: 無期限待機（承認されるまで実行されない）

---

## CI/CDパイプライン詳細

### Workflow一覧

| Workflow | トリガー | 目的 | 環境変数 |
|----------|---------|------|---------|
| **check.yml** | push to main, feature/** | コード品質チェック | RESEND_API_KEY |
| **staging.yml** | pull_request (opened, synchronize) | テスト送信 | AWS_*, S3_*, RESEND_API_KEY, REVIEWER_EMAIL |
| **production.yml** | push to main（マージ後） | 本番配信 | 同上 + GITHUB_TOKEN |

### 環境変数一覧（GitHub Secrets）

| Secret名 | 用途 | 例 |
|---------|------|---|
| `RESEND_API_KEY` | Resend API認証 | `re_abc123...` |
| `RESEND_FROM_EMAIL` | 送信元メールアドレス | `info@example.com` |
| `REVIEWER_EMAIL` | テストメール受信者 | `reviewer@example.com` |
| `AWS_ACCESS_KEY_ID` | AWS IAM認証 | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM認証 | `secret...` |
| `AWS_REGION` | S3リージョン | `ap-northeast-1` |
| `S3_BUCKET_NAME` | S3バケット名 | `my-mail-assets` |
| `S3_BUCKET_URL` | S3ベースURL | `https://my-mail-assets.s3.ap-northeast-1.amazonaws.com` |

### Check Workflow（check.yml）

```yaml
on:
  push:
    branches:
      - main
      - 'feature/**'

jobs:
  check:
    steps:
      - ESLint (pnpm run lint)
      - TypeScript (pnpm run type-check)
      - Build (pnpm run build)
      - Validate Archive (validate-archive.ts)
```

### Staging Workflow（staging.yml）

```yaml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  staging:
    steps:
      - Upload to S3 (upload-to-s3.ts)
      - Send Test Email (send-test-email.ts)
```

### Production Workflow（production.yml）

```yaml
on:
  push:
    branches:
      - main

jobs:
  production:
    environment: production  # Manual Approval
    steps:
      - Send Production Email (send-production-email.ts)
      - Update config.json (sentAt)
      - Git commit & push
```

---

## セキュリティとエラーハンドリング

### 環境変数の管理

- **GitHub Secrets**: すべての認証情報は GitHub Secrets で管理
- **ローカル開発**: `.env` ファイル（`.gitignore` に追加済み）
- **検証**: スクリプト起動時に必須環境変数の存在確認

### エラーハンドリング

| スクリプト | エラー処理 |
|----------|----------|
| **commit.ts** | ファイル存在確認、Git push失敗時のリトライ提案 |
| **validate-archive.ts** | Zodエラーメッセージ出力、Audience ID不正時の詳細ログ |
| **upload-to-s3.ts** | S3アップロード失敗時のファイル名とエラー内容出力 |
| **send-test-email.ts** | Resend APIエラー時のエラーコードとメッセージ出力 |
| **send-production-email.ts** | 同上 + config.json更新失敗時のロールバック |

### Zodスキーマによるランタイム検証

```typescript
const result = validateConfig(configData);
if (!result.success) {
  const errorMessages = result.error?.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  console.error(`Validation failed: ${errorMessages}`);
  process.exit(1);
}
```

---

## パフォーマンスと最適化

### 画像最適化

- **S3アップロード**: ContentType自動判定（MIME Type）
- **メール埋め込み**: `<img>` タグに `width`, `height` 属性必須（レイアウトシフト防止）

### ビルド最適化

- **Next.js**: `next.config.js` で `images: { unoptimized: true }`（メール用画像は最適化不要）
- **TypeScript**: `tsconfig.json` で `strict: true`（型安全性最大化）

### GitHub Actions 最適化

- **pnpm install --frozen-lockfile**: `package-lock.json` 使用（依存関係の固定）
- **Node.js cache**: `actions/setup-node@v4` の `cache: 'npm'` 使用

---

## 関連ドキュメント

- **要件定義書**: [docs/specs/require.md](./require.md)
- **実装タスクリスト**: [docs/specs/task.md](./task.md)
- **環境構築ガイド**: [docs/setup/environment.md](../setup/environment.md)
- **運用ガイド**: [docs/ops/workflow.md](../ops/workflow.md)
- **トラブルシューティング**: [docs/ops/troubleshooting.md](../ops/troubleshooting.md)
- **ブランチ戦略**: [docs/dev/branch.md](../dev/branch.md)

---

最終更新日: 2025-12-22
