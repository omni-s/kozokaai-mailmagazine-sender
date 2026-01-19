# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## プロジェクト概要

Resend メール配信システム。Next.js + React Email + Resend API + AWS S3 を組み合わせた、マーケティング担当者向けメールマガジン配信システムです。

**主な特徴:**
- ローカルでReactコンポーネントとしてメールをデザイン
- Git + GitHub Actionsによる完全自動化されたCI/CDパイプライン
- S3による画像ホスティング + Resend APIによる一斉配信
- Manual Approvalによる誤送信防止機構
- 予約配信機能（日本時間で配信日時を指定可能）

---

## 技術スタック

### ランタイム
- **Node.js**: 20.20.0（LTS、セキュリティ修正済み）
  - 脆弱性対応: CVE-2025-55131, CVE-2025-55130, CVE-2025-59465 他

### コア技術
- **Next.js**: 16.1.0 (App Router, Turbopack)
- **React**: 19.2.3
- **TypeScript**: 5.9.3
- **Tailwind CSS**: 4.1.18 (@tailwindcss/postcss)

### メール配信
- **Resend API**: メール配信プラットフォーム（SDK v6.6.0）
- **@react-email/render**: React → HTML変換（非同期API: `await render()`、v2.0.0）
- **@react-email/components**: メール用Reactコンポーネント

### インフラ
- **AWS S3**: 画像アセット配信（SDK v3使用）
- **GitHub Actions**: CI/CD（Manual Approval機能）

### CLI & Validation
- **inquirer**: 対話型CLI
- **Zod**: スキーマ検証
- **tsx**: TypeScript実行
- **date-fns-tz**: タイムゾーン変換（JST ↔ UTC）

---

## 開発コマンド

### ローカル開発

```bash
# 開発サーバー起動（Hot Reload有効）
pnpm run dev

# ブラウザで http://localhost:3000 を開く
# メール制作は http://localhost:3000/draft
```

### ビルド・検証

```bash
# Next.jsビルド
pnpm run build

# ESLint実行
pnpm run lint

# TypeScript型チェック
pnpm run type-check
```

### メール配信フロー

```bash
# ローカル制作完了後のアーカイブ・コミット
pnpm run commit
```

対話形式で以下を入力:
- コミットメッセージ（例: `summer-sale`）
- メール件名（例: `【サマーセール】最大50%OFFのお知らせ`）
- Resend Segment ID（例: `78261eea-8f8b-4381-83c6-79fa7120f1cf`）
- 配信タイミング（即時配信 or 予約配信）
- 配信日時（予約配信の場合、JST、例: `2026-01-20 18:00`）

スクリプトが自動的に:
1. アーカイブディレクトリを作成（`public/archives/{YYYY}/{MM}/{DD-MSG}/`）
2. `src/app/draft/page.tsx` → `mail.tsx` に移動
3. `public/mail-assets/` → `assets/` に画像移動
4. `config.json` 生成（subject, segmentId, scheduledAt, sentAt: null）
5. `src/app/draft/page.tsx` を初期テンプレートにリセット
6. Git commit & push（コミットメッセージ: `MAIL: {message}`）

---

## アーキテクチャ概要

### ディレクトリ構造

```
kozokaai-mailmagazine-sender/
├── src/
│   ├── app/
│   │   ├── draft/              # ローカル編集用
│   │   │   ├── page.tsx        # メールテンプレート編集
│   │   │   └── template.tsx    # 初期テンプレート
│   │   ├── layout.tsx
│   │   ├── page.tsx            # ホーム画面
│   │   └── globals.css
│   ├── components/
│   │   ├── email/              # メール用コンポーネント
│   │   │   ├── EmailWrapper.tsx # テーブルレイアウト（メールクライアント互換）
│   │   │   └── Img.tsx         # 画像パス解決コンポーネント
│   │   └── ui/                 # ShadcnUI コンポーネント
│   ├── lib/
│   │   ├── resend.ts           # Resend SDK初期化
│   │   ├── s3.ts               # S3 Client初期化
│   │   ├── config-schema.ts    # Zodスキーマ（config.json検証）
│   │   └── utils.ts            # Tailwind utilities
│   └── scripts/                # CLI・自動化スクリプト
│       ├── commit.ts           # pnpm run commit
│       ├── validate-archive.ts # GitHub Actions: バリデーション
│       ├── upload-to-s3.ts     # GitHub Actions: S3アップロード
│       ├── send-test-email.ts  # GitHub Actions: テスト送信
│       └── send-production-email.ts  # GitHub Actions: 本番配信
├── public/
│   ├── mail-assets/            # 作業中の画像置き場
│   └── archives/               # メールアーカイブ
│       └── {YYYY}/
│           └── {MM}/
│               └── {DD-MSG}/
│                   ├── mail.tsx
│                   ├── config.json
│                   └── assets/
├── .github/
│   └── workflows/              # CI/CD
│       ├── check.yml                      # Lint, Type Check, Build, Validation
│       ├── staging.yml                    # S3 Upload, Test Email Send
│       ├── production.yml                 # Production Email Send (Manual Approval)
│       └── scheduled-email-delivery.yml   # Scheduled Email Delivery (Cron: */5)
└── docs/                       # ドキュメント（唯一のSoT）
    ├── INDEX.md                # ドキュメント索引
    ├── specs/                  # 仕様関連
    │   ├── require.md
    │   ├── task.md
    │   └── architecture.md
    ├── dev/                    # 開発関連
    │   ├── branch.md
    │   └── devcontainer.md
    ├── setup/                  # 環境構築
    │   └── environment.md
    └── ops/                    # 運用関連
        ├── workflow.md
        ├── troubleshooting.md
        ├── security-updates.md
        └── todo.md
```

### データフロー

#### 即時配信フロー

```
ローカル制作（src/app/draft/page.tsx）
  ↓
pnpm run commit（アーカイブ作成 + 配信タイミング: 即時配信）
  ↓
Git push
  ↓
GitHub Actions: Check Workflow（Lint, Build, Validation）
  ↓
PR作成
  ↓
GitHub Actions: Staging Workflow（S3 Upload, Test Email Send）
  ↓
レビュー・承認 → マージ
  ↓
GitHub Actions: Production Workflow（Manual Approval待機）
  ↓
承認ボタン押下
  ↓
production-dispatcher.ts（scheduledAt === null → 即時配信実行）
  ↓
本番配信（Resend Audience へ一斉送信）
  ↓
config.json の sentAt 自動更新（Git commit & push）
```

#### 予約配信フロー

```
ローカル制作（src/app/draft/page.tsx）
  ↓
pnpm run commit（アーカイブ作成 + 配信タイミング: 予約配信 + 日時指定）
  ↓
Git push
  ↓
GitHub Actions: Check Workflow（Lint, Build, Validation）
  ↓
PR作成
  ↓
GitHub Actions: Staging Workflow（S3 Upload, Test Email Send）
  ↓
レビュー・承認 → マージ
  ↓
GitHub Actions: Production Workflow（Manual Approval待機）
  ↓
承認ボタン押下
  ↓
production-dispatcher.ts（scheduledAt > 現在時刻 → ログ出力のみ）
  ↓
Scheduled Email Delivery Workflow（5分ごとcron）
  ↓
send-scheduled-emails.ts（scheduledAt <= 現在時刻 → 配信実行）
  ↓
本番配信（Resend Audience へ一斉送信）
  ↓
config.json の sentAt 自動更新（Git commit & push）
```

---

## 重要な設計パターン

### 1. メールHTML互換性

**問題**: Modern CSS（flexbox、grid）は多くのメールクライアント（Outlook、Gmail）で非対応。

**解決策**: `EmailWrapper.tsx` で `<table>` タグ + インラインスタイルを使用。

**実装**:
- 外側テーブル: 100%幅、背景色 #f6f9fc
- 内側テーブル: 600px固定幅、背景色 #ffffff
- 中央揃え: `<td align="center">`（`margin: 0 auto` 非対応対策）

### 2. 画像パス置換ロジック

**開発時**: `/mail-assets/hero.png`（ローカル開発サーバー用）
**本番時**: `https://bucket.s3.region.amazonaws.com/archives/YYYY/MM/DD-MSG/assets/hero.png`

**実装**: `send-test-email.ts` と `send-production-email.ts` の `replaceImagePaths()` 関数で正規表現置換。

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

### 3. Resend API の破壊的変更

**@react-email/render**:
- **v1.0.0以降**: `render()` が非同期（Promise返却）
- **必須**: `await render(Component(), { plainText: false })`

**Resend broadcasts API**:
- **v4.0.0以降**: 2ステップ方式（create → send）

```typescript
// Step 1: Broadcast作成
const { data: createData, error: createError } = await resend.broadcasts.create({
  name: `Broadcast - ${subject}`,
  audienceId: audienceId,
  from: fromEmail,
  subject: subject,
  html,
});

// Step 2: Broadcast送信
const { data: sendData, error: sendError } = await resend.broadcasts.send(createData.id);
```

### 4. Tailwind CSS 4.x PostCSS Migration

**破壊的変更**: Tailwind CSS 4.x は専用PostCSSプラグインが必要。

**postcss.config.js**:
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},  // 旧: tailwindcss: {}
    autoprefixer: {},
  },
};
```

**package.json**:
- `@tailwindcss/postcss`: 必須依存
- `tailwindcss`: 4.1.18（devDependencies）

### 5. EmailWrapper の preview モード

**問題**: ブラウザプレビュー（Next.js）とメール配信（Resend）で必要なHTML構造が異なる。

**解決策**: `preview` prop で切り替え。

**実装**:
- `preview={true}`: `<table>` のみ返却（Next.js App Router用、`<html>`, `<body>` なし）
- `preview={false}`（デフォルト）: `<html>`, `<body>` を含むフルHTML（メール配信用）

**使用例**:
```typescript
// ブラウザプレビュー（src/app/draft/page.tsx）
<EmailWrapper preview={true} previewText="...">
  {children}
</EmailWrapper>

// メール配信（src/scripts/send-test-email.ts）
<EmailWrapper previewText="...">
  {children}
</EmailWrapper>
```

**背景**:
- Next.js App Router では `layout.tsx` が `<html>`, `<body>` を提供
- EmailWrapper が同じタグを出力すると hydration error が発生
- `preview={true}` でブラウザプレビュー時のみテーブルレイアウトを返却

---

## GitHub Actions Workflows

### check.yml
**Trigger**: `main`, `feature/**` へのPush

**処理内容**:
- ESLint実行
- TypeScript型チェック
- Next.jsビルド
- アーカイブバリデーション（config.json、画像パス、Segment ID確認）

### staging.yml
**Trigger**: Pull Request作成・更新

**処理内容**:
- 新規追加されたarchiveディレクトリを検出
- 画像をS3へアップロード（public-read）
- React → HTML変換
- テストメール送信
  - `TEST_SEGMENT_ID` 設定時: Segment一斉送信（件名: `[TEST] {subject}`）
  - 未設定時: `REVIEWER_EMAIL` へ個別送信（件名: `[TEST] {subject}`）

### production.yml
**Trigger**: `main` へのマージ

**処理内容**:
- **Manual Approval待機**（GitHub Environments機能）
- `production-dispatcher.ts` を実行
  - `scheduledAt === null` → 即時配信実行
  - `scheduledAt > 現在時刻` → ログ出力のみ（予約配信待機）
  - `scheduledAt <= 現在時刻` → 即時配信実行（過去日時の場合）
- `config.json` の `sentAt` を更新してコミット（即時配信の場合のみ）

### scheduled-email-delivery.yml
**Trigger**: cron（5分ごと）、手動実行（`workflow_dispatch`）

**処理内容**:
- **Manual Approval不要**（無人実行）
- `send-scheduled-emails.ts` を実行
  - S3から全config.jsonを取得
  - `scheduledAt` が現在時刻±5分以内のアーカイブを抽出
  - 重複送信防止: `sentAt !== null` の場合はスキップ
  - Resend Audience へ一斉送信
- `config.json` の `sentAt` を更新してコミット

---

## 環境変数

### ローカル開発用（.env）

```bash
# Resend API
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_email@example.com

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=your_bucket_name
S3_BUCKET_URL=https://your_bucket_name.s3.ap-northeast-1.amazonaws.com

# Test Email
REVIEWER_EMAIL=reviewer@example.com

# Test Email - Segment送信（オプション）
# TEST_SEGMENT_IDが設定されている場合、Segment一斉送信でテストメール送信
# 未設定の場合、REVIEWER_EMAILに個別送信
TEST_SEGMENT_ID=your_test_segment_id
```

### GitHub Actions用（GitHub Secrets）

上記すべて + `GITHUB_TOKEN`（自動設定済み）

**GitHub Environments**:
- `production` 環境を作成
- Protection Rules で承認者を設定

---

## ドキュメント運用ルール

### 基本方針
- ルール/知見は `docs/` に集約（唯一のSoT）
- 変更時は `docs/INDEX.md` を必ず更新
- ドキュメントコミットは `DOC:` プレフィックス
- 機密情報（PII等）は `docs/` に保存しない

### 運用フロー（PDCA）
1. **PLAN**: `docs/INDEX.md` で既存配置と命名を確認
2. **DO**: 該当 `docs/` ファイルを更新 or 新規作成
3. **CHECK**: リンク切れ/重複/命名不整合が無いか確認
4. **ACTION**: 運用改善点や不足ルールをドキュメント化

### 命名・配置ガイド
- ファイル名は `kebab-case.md`、目的が明確な名前
- 1ファイルが 300 行超 or 技術領域が分岐 → 分割/ディレクトリ化
- 代表例:
  - `docs/dev/branch.md`（ブランチ戦略/CI）
  - `docs/coding-standards.md`（規約）
  - `docs/import-path-migration.md`（移行ガイド）

### 主要ドキュメント

- **[docs/INDEX.md](./docs/INDEX.md)**: ドキュメント索引
- **[docs/specs/require.md](./docs/specs/require.md)**: 要件定義書
- **[docs/specs/architecture.md](./docs/specs/architecture.md)**: システムアーキテクチャ
- **[docs/dev/branch.md](./docs/dev/branch.md)**: ブランチ戦略とCI/CD
- **[docs/ops/workflow.md](./docs/ops/workflow.md)**: 日常的な配信フロー
- **[docs/ops/troubleshooting.md](./docs/ops/troubleshooting.md)**: トラブルシューティング
- **[docs/ops/security-updates.md](./docs/ops/security-updates.md)**: セキュリティアップデート手順

---

## コミットメッセージ規約

### プレフィックス

- `MAIL:` - メール配信関連（アーカイブ作成、本番配信）
- `FIX:` - バグ修正
- `FEAT:` - 新機能追加
- `DOC:` - ドキュメント更新
- `CHORE:` - ビルド、設定変更

### 例

```
MAIL: summer-sale
FIX: React2Shell脆弱性対応（CVE-2025-55182）
DOC: セキュリティアップデート手順を追加
FEAT: Manual Approval機能を追加
CHORE: Add devcontainer configuration
```

---

## セキュリティ対応履歴

### React2Shell（CVE-2025-55182）

**初回対応**: 2025-12-19（commit b68945f）

**脆弱性**: Next.js 15.0.0-16.0.6 + React 19 でリモートコード実行が可能

**対応内容**:
- Next.js 15.1.3 → 15.5.9
- React/React-DOM 19.0.0 → 19.2.3
- Tailwind CSS 4.x PostCSS migration（@tailwindcss/postcss）
- @react-email/render Promise対応（`await` 追加）
- Resend broadcasts API 2ステップ方式へ移行
- Button component `asChild` プロパティ削除対応

**最新版アップグレード**: 2025-12-22

**対応内容**:
- @react-email/render 1.0.1 → 2.0.0
- Resend SDK 4.0.1 → 6.6.0
- TypeScript 5.7.2 → 5.9.3
- Next.js/React: 現状維持（既にCVE対応済み）

**参考**: `docs/ops/security-updates.md`

### Node.js セキュリティアップデート

**対応日**: 2026-01-19

**脆弱性**: Node.js December 2025 Security Releases

**対応内容**:
- Node.js 20.x → 20.20.0
- すべてのGitHub Actionsワークフローを更新（check.yml, staging.yml, production.yml, scheduled-email-delivery.yml）
- .nvmrc ファイルを作成（ローカル開発環境の一貫性確保）

**修正された脆弱性**:
- CVE-2025-55131: Timeout-based race conditions（High）
- CVE-2025-55130: ファイルシステム権限バイパス（High）
- CVE-2025-59465: HTTP/2サーバークラッシュ（High）
- CVE-2025-59466: async_hooksスタックオーバーフロー（Medium）
- CVE-2026-21637: TLSコールバック例外（Medium）
- CVE-2025-55132: fs.futimes()権限バイパス（Low）

**参考**: https://nodejs.org/en/blog/vulnerability/december-2025-security-releases

---

## トラブルシューティング

### pnpm run commit エラー

**症状**: `draft/page.tsx が見つかりません`

**原因**: `src/app/draft/page.tsx` が存在しない

**解決策**: `src/app/draft/template.tsx` から復元

---

### GitHub Actions エラー

**Check Workflow失敗**:
- ESLint: `pnpm run lint` でローカル確認
- TypeScript: `pnpm run type-check` でローカル確認
- Validation: `config.json` の形式、Segment ID確認

**Staging Workflow失敗**:
- S3アップロード: AWS認証情報確認（GitHub Secrets）
- テスト送信: `REVIEWER_EMAIL` 確認

**Production Workflow失敗**:
- Manual Approval: 承認者が承認ボタン押下済みか確認
- Resend API: Segment ID存在確認

---

## 参考リンク

- [Resend公式ドキュメント](https://resend.com/docs)
- [Next.js公式ドキュメント](https://nextjs.org/docs)
- [@react-email/render](https://react.email/docs/utilities/render)
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)

---

最終更新日: 2025-12-22
