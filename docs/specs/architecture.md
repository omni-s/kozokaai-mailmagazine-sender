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
                    │   MAIL-ASSETS/       │
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
│                       Stagingフェーズ                             │
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
│                      Productionフェーズ                           │
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
│   ├── MAIL-ASSETS/               # 制作中の画像
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
  │     └── <Img src="/MAIL-ASSETS/hero.png" /> (画像参照)
  └── <p>メール本文...</p>

           │
           │ pnpm run commit
           ▼

public/archives/2024/05/20-summer-sale/
  ├── mail.tsx (draft/page.tsx をコピー)
  ├── assets/
  │     └── hero.png (MAIL-ASSETS/ から移動)
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
  │     /MAIL-ASSETS/hero.png
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

メール制作時に使用する画像パス（`/MAIL-ASSETS/hero.png`）は、ローカル開発サーバーでのみ有効です。実際のメール配信では、S3にホスティングされた画像を参照する必要があります。

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
        src="/MAIL-ASSETS/hero.png"
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
  const pattern = /<Img[^>]*src=['"]\/MAIL-ASSETS\/([^'"]+)['"]/g;

  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(/\/MAIL-ASSETS\/[^'"]+/, s3Url);
  });
}
```

**置換結果**:

```html
<!-- Before -->
<img src="/MAIL-ASSETS/hero.png" alt="Hero Image" width="600" height="400" />

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
| `S3_BUCKET_NAME` | S3バケット名 | `my-MAIL-ASSETS` |
| `S3_BUCKET_URL` | S3ベースURL | `https://my-MAIL-ASSETS.s3.ap-northeast-1.amazonaws.com` |

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

- **pnpm/action-setup**: v4 使用（pnpm version 10 指定）
- **pnpm install --frozen-lockfile**: `pnpm-lock.yaml` 使用（依存関係の固定）
- **Node.js cache**: `actions/setup-node@v4` の `cache: 'pnpm'` 使用

**設定例**（`.github/workflows/staging.yml` L19-21）:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 10
```

---

## 配信停止メカニズム

### 実装

**Resend Broadcast APIによる自動配信停止管理**

Resend APIは、マーケティングメールに必須の配信停止機能を完全サポートしています。本プロジェクトでは、`EmailFooter.tsx`コンポーネントに配信停止リンクを含め、`EmailWrapper.tsx`から呼び出すことで、FTC（米国）およびGDPR（欧州）の法的要件に準拠しています。

### 動作フロー

```
1. メール本文に {{{RESEND_UNSUBSCRIBE_URL}}} プレースホルダーを含める
   ↓
2. Resendが各受信者専用の配信停止URLを生成
   （例: https://resend.com/unsubscribe/{token}）
   ↓
3. 受信者が配信停止リンクをクリック
   ↓
4. Resend Dashboard → Contacts で配信停止状態（unsubscribed: true）に更新
   ↓
5. 次回のBroadcast送信時、配信停止ユーザーを自動的にスキップ
```

### 実装詳細

#### EmailFooter.tsx（`src/components/email/EmailFooter.tsx`）

配信停止リンクを含むFooterを独立したコンポーネントとして実装。

**設計方針**:
- props を受け取らない（固定実装、安全性優先）
- JSDocコメントで配信停止リンクの重要性を明記
- コード内コメントで「削除しないでください」を明示
- EmailWrapper内で自動的に呼び出される

**コンポーネント責務**:
- 企業情報の表示
- 著作権表示
- 配信停止リンク（FTC/GDPR対応）

**誤削除防止機構**:
1. 独立したコンポーネントファイル（`EmailFooter.tsx`）
2. JSDocコメントで法的要件を明記
3. コード内コメントで削除禁止を明示
4. EmailWrapper内で強制的に呼び出される設計

```tsx
{/* 配信停止リンク（FTC/GDPR対応） */}
{/* ⚠️ 重要: このリンクを削除しないでください */}
<p style={{ margin: '12px 0 0 0' }}>
  <a
    href="{{{RESEND_UNSUBSCRIBE_URL}}}"
    style={{
      color: '#94a3b8',
      textDecoration: 'underline',
      fontSize: '12px',
    }}
  >
    配信停止 / Unsubscribe
  </a>
</p>
```

**重要なポイント**:
- `{{{RESEND_UNSUBSCRIBE_URL}}}` はResendが各受信者専用のURLに自動置換
- インラインスタイルを使用（メールクライアント互換性）
- 色は `#94a3b8`（既存のフッターと同じ）で統一
- `preview` プロパティの分岐処理は不要（プレースホルダーはブラウザでもそのまま表示される）

#### 配信停止処理のメカニズム

| 段階 | 処理内容 | 担当 |
|------|---------|------|
| **1. リンク埋め込み** | `{{{RESEND_UNSUBSCRIBE_URL}}}` をメール本文に含める | EmailWrapper.tsx |
| **2. URL生成** | 各受信者専用の配信停止URLを生成 | Resend API（自動） |
| **3. クリック** | 受信者が配信停止リンクをクリック | ユーザー |
| **4. 状態更新** | Contacts の `unsubscribed: true` に更新 | Resend API（自動） |
| **5. スキップ** | 次回Broadcast送信時に自動的にスキップ | Resend API（自動） |

### 重複送信防止

- 配信停止したユーザーは `resend.broadcasts.send()` で自動的にスキップされる
- 手動でContactsから削除する必要はない
- GitHub Actions → Scheduled Email Delivery のログで「配信停止ユーザーをスキップ」と記録される

**実装例**（`send-production-email.ts`）:

```typescript
// Broadcast送信時、Resendが自動的に配信停止ユーザーをスキップ
const { data: sendData, error: sendError } = await resend.broadcasts.send(createData.id);
```

### 配信停止状態の確認方法

#### 1. Resend Dashboard

**Resend Dashboard → Audiences → Contacts**

- `unsubscribed: true` のContactsを確認
- フィルター機能で配信停止ユーザーのみ表示可能

#### 2. Resend Contacts API

**コマンド例**:

```bash
# Contact情報を取得
curl -X GET 'https://api.resend.com/contacts?email=test@example.com' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  | jq '.data[] | {email: .email, unsubscribed: .unsubscribed}'
```

**期待される出力**:

```json
{
  "email": "test@example.com",
  "unsubscribed": true
}
```

#### 3. 配信ログ

**GitHub Actions → Scheduled Email Delivery → Logs**

```
✓ 本番メール配信
  送信ID: {UUID}
  配信対象: 100件
  配信停止ユーザー: 5件（スキップ）
  実際の配信数: 95件
```

### 法的コンプライアンス

#### FTC要件（米国連邦取引委員会）

**CAN-SPAM Act**:
- マーケティングメールには配信停止オプションが必須
- 配信停止リクエストを10営業日以内に処理（Resendが自動処理）
- 配信停止手段は明確で、簡単にアクセス可能であること
- 配信停止後の再購読は任意

**本実装での対応**:
- ✅ メール本文に明確な配信停止リンクを含める
- ✅ Resendが自動的に配信停止を処理（即座に反映）
- ✅ 配信停止ユーザーは次回配信で自動的にスキップされる

#### GDPR要件（欧州一般データ保護規則）

**個人データの削除権（Right to be forgotten）**:
- ユーザーは個人データの削除を要求できる
- 配信停止は「削除」ではなく「マーケティング同意の撤回」として扱われる

**本実装での対応**:
- ✅ 明確な配信停止リンクの表示
- ⚠️ 完全な個人データ削除が必要な場合、Resend Contacts APIで手動削除が必要

**削除手順（オプション）**:

```bash
# Contact削除
curl -X DELETE 'https://api.resend.com/contacts/{contact_id}' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

#### トランザクションメール vs マーケティングメール

| メール種別 | 配信停止リンク | 例 |
|----------|---------------|---|
| **マーケティングメール** | **必須** | ニュースレター、セール情報、キャンペーン |
| **トランザクションメール** | 不要 | パスワードリセット、注文確認、領収書 |

**本プロジェクトの対象**: マーケティングメール（メールマガジン配信）

### カスタマイズオプション

#### 1. Resend Dashboard での配信停止ページカスタマイズ

**設定場所**: [Resend Dashboard](https://resend.com/settings/unsubscribe-page) → Settings → Unsubscribe Page

**カスタマイズ内容**:
- ロゴ: プロジェクトのロゴをアップロード
- 背景色: `#f1f5f9`（EmailWrapperの背景色と統一）
- テキスト色: `#1e293b`（メール本文の色と統一）
- 配信停止確認メッセージ: 日本語化（例: 「配信停止が完了しました。今後メールは送信されません。」）
- 再購読リンク: 「再購読する場合はこちら」

**注意**: この設定は全てのBroadcastに適用される

#### 2. Topics機能（将来拡張案）

**概要**: 配信の種類ごとに配信停止を設定可能にする

**実装内容**:
- Resend Topics APIを使用
- 例: "ニュースレター", "セール情報", "システム通知"
- ユーザーが興味のある配信のみを受信できる

**参考**: [Resend Topics ドキュメント](https://resend.com/blog/unsubscribe-topics)

#### 3. カスタム配信停止ページ（将来拡張案）

**概要**: Next.jsアプリ内に配信停止ページを実装

**実装内容**:
- より詳細な配信停止理由の収集（アンケート形式）
- 配信頻度の調整オプション（毎日 → 週1回など）
- 再購読リンクの提供

**実装場所**: `src/app/unsubscribe/page.tsx`

### 参考リンク

- [Resend - Should I add an unsubscribe link?](https://resend.com/docs/knowledge-base/should-i-add-an-unsubscribe-link)
- [Resend - Broadcast API](https://resend.com/docs/api-reference/broadcasts/create-broadcast)
- [Resend - Custom Unsubscribe](https://resend.com/changelog/custom-unsubscribe)
- [Resend - Unsubscribe Topics](https://resend.com/blog/unsubscribe-topics)
- [FTC - CAN-SPAM Act](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [GDPR - Right to be forgotten](https://gdpr-info.eu/art-17-gdpr/)

---

## アーカイブ上書き確認メカニズム

### 概要

GUI（http://localhost:3000）から配信準備を実行する際、既存のアーカイブディレクトリが存在する場合に上書き確認ダイアログを表示し、ユーザーに選択させる機能を実装しています。

### 実装方式

**GUI実装**: Mantine Modal + 二段階リクエスト

### 動作フロー

```
1. ユーザーがフォーム送信
   ↓
2. API: 409 Conflict（既存ディレクトリ検出）
   ↓
3. 確認ダイアログ表示（黄色Alert + 赤色「上書きする」ボタン）
   ↓
4. ユーザーが選択
   ├─ キャンセル → Alert表示（エラーメッセージ）
   └─ 上書き → `overwrite: true`フラグで再送信
       ↓
     API: `fs.rmSync()`で既存削除 → 新規作成
       ↓
     成功レスポンス
```

### 実装詳細

#### CommitForm.tsx（`src/components/commit/CommitForm.tsx`）

**State追加**（L41-42）:
```typescript
const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
const [pendingRequest, setPendingRequest] = useState<CommitAnswers | null>(null);
```

**API呼び出しロジック分離**（L93-141）:
```typescript
const executeCommit = async (data: CommitAnswers, overwrite: boolean = false) => {
  // 409 Conflict検出時に確認ダイアログ表示
  if (response.status === 409 && !overwrite) {
    setPendingRequest(data);
    setShowOverwriteConfirm(true);
    setLoading(false);
    return;
  }
  // その他のエラーハンドリング...
};
```

**確認ダイアログ**（L279-302）:
```tsx
<Modal
  opened={showOverwriteConfirm}
  onClose={handleOverwriteCancel}
  title="アーカイブ上書き確認"
  size="md"
  centered
  closeOnClickOutside={false}
  withCloseButton={false}
>
  <Stack gap="md">
    <Alert color="yellow" title="警告">
      このアーカイブは既に存在します。上書きすると既存のデータが完全に削除されます。
    </Alert>

    <Group justify="flex-end" mt="md">
      <Button variant="default" onClick={handleOverwriteCancel}>
        キャンセル
      </Button>
      <Button color="red" onClick={handleOverwriteConfirm} loading={loading}>
        上書きする
      </Button>
    </Group>
  </Stack>
</Modal>
```

**UI設計の根拠**:
- `closeOnClickOutside={false}`: 誤操作防止（モーダル外クリックで閉じない）
- `withCloseButton={false}`: 明示的な選択を強制（×ボタン非表示）
- Alert + 警告色: 危険性を視覚的に強調
- ボタン配置: キャンセル（左）、上書き（右、赤色）
- loading state: 二重送信防止

#### API Endpoint（`src/app/api/commit/route.ts`）

**型定義拡張**（L21-28）:
```typescript
interface CommitRequestBody {
  commitMessage: string;
  subject: string;
  segmentId: string;
  scheduleType: 'immediate' | 'scheduled';
  scheduledAt?: string;
  overwrite?: boolean; // 追加
}
```

**上書きロジック実装**（L213-240）:
```typescript
if (fs.existsSync(archiveDir)) {
  if (!overwrite) {
    // 上書き未承認 → 409 Conflict
    return NextResponse.json(
      {
        success: false,
        message: `アーカイブ ${dd}-${commitMessage} は既に存在します`,
      },
      { status: 409 }
    );
  }

  // 上書き承認済み → 既存ディレクトリ削除
  console.log('[API /commit] 既存アーカイブを削除中...', archiveDir);
  try {
    fs.rmSync(archiveDir, { recursive: true, force: true });
    console.log('[API /commit] 既存アーカイブ削除完了');
  } catch (deleteError) {
    console.error('[API /commit] アーカイブ削除エラー:', deleteError);
    return NextResponse.json(
      {
        success: false,
        message: '既存アーカイブの削除に失敗しました。ファイルがロックされている可能性があります。',
      },
      { status: 500 }
    );
  }
}
```

### エラーハンドリング

#### 通常エラー（400, 500など）

```
ユーザー送信
  ↓
API処理（バリデーション/処理エラー）
  ↓
CommitForm: result State更新
  ↓
Alert表示（赤色、エラーメッセージ）
```

#### アーカイブ既存エラー（409）

```
ユーザー送信
  ↓
API: 409 Conflict返却
  ↓
CommitForm: showOverwriteConfirm = true
  ↓
確認ダイアログ表示
  ├─ キャンセル → Alert表示（エラーメッセージ）
  └─ 上書き → overwrite: true で再送信
       ↓
     API: 既存削除 → 新規作成
       ↓
     成功レスポンス
```

#### 削除失敗エラー（500）

```
上書き承認 → API呼び出し
  ↓
fs.rmSync() エラー（権限不足/ロック）
  ↓
500エラー + 詳細メッセージ
  ↓
Alert表示「既存アーカイブの削除に失敗しました...」
```

### セキュリティ考慮事項

#### ディレクトリトラバーサル対策

現在の実装は安全:
- `commitMessage`のバリデーション（L48-52）で`/\:*?"<>|`を禁止
- `path.join()`で安全にパス結合
- `fs.existsSync()`でディレクトリ存在確認後に削除

#### レースコンディション対策

**潜在的リスク**: 同時に2つのリクエストが同じアーカイブを上書き

**緩和策**（現実装で十分）:
- Git pushが最終的な排他制御として機能
- 同一ブランチで同時コミットは失敗する
- GitHub ActionsのCheckワークフローで検証

### CLI版との一貫性

| 項目 | CLI (`commit.ts` L660-683) | GUI（本実装） |
|------|---------------------------|--------------|
| 確認UI | `inquirer.prompt()` | Mantine Modal |
| 削除処理 | `fs.rmSync()` 同一 | `fs.rmSync()` 同一 |
| エラーハンドリング | プロセス終了 | 500エラー返却 |
| ユーザー体験 | ターミナル対話 | GUIダイアログ |

### パフォーマンス影響

#### APIレスポンスタイム

- 通常フロー: 変更なし
- 上書きフロー: `fs.rmSync()`のオーバーヘッド（通常 < 100ms）
- S3アップロード時間が支配的（数百ms〜数秒）

**結論**: 体感上の影響なし

#### ネットワークリクエスト

- 通常: 1回（POST /api/commit）
- 上書き: 2回（初回 → 409 → 再送信）

**結論**: 上書きは例外的な操作なので許容範囲

---

## 関連ドキュメント

- **要件定義書**: [docs/specs/require.md](./require.md)
- **実装タスクリスト**: [docs/specs/task.md](./task.md)
- **環境構築ガイド**: [docs/setup/environment.md](../setup/environment.md)
- **運用ガイド**: [docs/ops/workflow.md](../ops/workflow.md)
- **トラブルシューティング**: [docs/ops/troubleshooting.md](../ops/troubleshooting.md)
- **ブランチ戦略**: [docs/dev/branch.md](../dev/branch.md)

---

最終更新日: 2026-01-20
