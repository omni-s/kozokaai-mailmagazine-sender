# Resend メール配信システム

Next.js + React Email + Resend API + AWS S3 を組み合わせた、マーケティング担当者向けメールマガジン配信システムです。
ローカルで React コンポーネントとしてメールをデザインし、Git + GitHub Actions による完全自動化された CI/CD パイプラインで安全に配信します。

### 主な機能

- ローカル編集 & リアルタイムプレビュー（Next.js App Router）
- GitOps 配信フロー（PR レビュー + Manual Approval）
- 即時配信 / 予約配信（JST 指定、5分間隔 cron）
- PR 配信サマリー（テスト送信結果を PR コメントに自動投稿）
- Contact 一括インポート（CSV → Resend Contacts）
- 返信メール送信（受信者への個別返信 CLI）
- 配信停止機能（Resend Unsubscribe、FTC/GDPR 対応）

![kai-cicd-mail-flow](https://github.com/user-attachments/assets/54a1dda2-71e8-420d-bca6-c01b1001ab0f)
![kai-cicd-mail-flow-draft](https://github.com/user-attachments/assets/faf0f980-8e44-4f49-b55f-21b33166af63)

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| Runtime | Node.js | 20.20.0 |
| Framework | Next.js (App Router) | 16.1.0 |
| Language | TypeScript | 5.9.3 |
| UI | React + Mantine UI | 19.2.3 / 7.15.0 |
| Email | Resend SDK + @react-email | 6.6.0 / 2.0.0 |
| Storage | AWS S3 (SDK v3) | - |
| CI/CD | GitHub Actions | - |
| Validation | Zod | 3.24.1 |

## クイックスタート

### 1. 依存関係インストール

```bash
pnpm install
```

### 2. 環境変数設定

`.env.example` をコピーして `.env` を作成:

```bash
cp .env.example .env
```

**必須環境変数:**

```bash
# Resend API
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_email@example.com
RESEND_FROM_NAME=表示名
RESEND_REPLY_TO=reply@example.com

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=your_bucket_name
S3_BUCKET_URL=https://your_bucket_name.s3.ap-northeast-1.amazonaws.com

# Test Email（オプション: Segment一斉テスト送信）
TEST_SEGMENT_ID=your_test_segment_id
```

### 3. 開発サーバー起動

```bash
pnpm run dev
# http://localhost:3000 でプレビュー
# http://localhost:3000/draft でメール編集
```

## 配信フロー

### 即時配信

```
ローカル制作 → pnpm run commit（即時配信を選択）
  → Git push → Check Workflow → PR作成
  → Staging Workflow（S3 Upload + テスト送信 + PR配信サマリー）
  → レビュー・承認 → マージ
  → Production Workflow → Manual Approval → 本番配信
  → sentAt 自動更新
```

### 予約配信

```
ローカル制作 → pnpm run commit（予約配信 + JST日時を指定）
  → Git push → Check / Staging Workflow（同上）
  → レビュー・承認 → マージ
  → Production Workflow → Manual Approval → 待機
  → Scheduled Delivery Workflow（5分ごと cron）→ 指定時刻に配信
  → sentAt 自動更新
```

## npm scripts

| コマンド | 説明 |
|---------|------|
| `pnpm run dev` | 開発サーバー起動 |
| `pnpm run build` | Next.js ビルド |
| `pnpm run lint` | ESLint 実行 |
| `pnpm run type-check` | TypeScript 型チェック |
| `pnpm run commit` | メールアーカイブ作成 + Git commit & push |
| `pnpm run reset-draft` | draft/page.tsx を初期テンプレートにリセット |
| `pnpm run reply-email` | 受信者への返信メール送信（対話型 CLI） |
| `pnpm run import-contacts` | CSV → Resend Contacts 一括インポート |

## GitHub Actions

| Workflow | Trigger | 概要 |
|----------|---------|------|
| `check.yml` | Push (`main`, `feature/**`) | Lint, Type Check, Build, Archive Validation |
| `staging.yml` | Pull Request | S3 Upload, テスト送信, PR配信サマリー投稿 |
| `production.yml` | `main` マージ | Manual Approval → 本番配信（即時 or 待機） |
| `scheduled-email-delivery.yml` | cron (*/5) / 手動 | 予約配信の実行（scheduledAt 到達時に自動配信） |

## 環境変数

### GitHub Secrets（機密情報）

| 変数名 | 説明 |
|--------|------|
| `RESEND_API_KEY` | Resend API キー |
| `RESEND_FROM_EMAIL` | 送信元メールアドレス |
| `S3_BUCKET_URL` | S3 バケットの Base URL |
| `AWS_ACCESS_KEY_ID` | AWS アクセスキー ID |
| `AWS_SECRET_ACCESS_KEY` | AWS シークレットアクセスキー |
| `AWS_REGION` | AWS リージョン |
| `S3_BUCKET_NAME` | S3 バケット名 |

### GitHub Variables（非機密情報）

| 変数名 | 説明 |
|--------|------|
| `RESEND_FROM_NAME` | From 表示名 |
| `RESEND_REPLY_TO` | Reply-To アドレス |
| `TEST_SEGMENT_ID` | テスト用 Segment ID（設定時: Segment一斉テスト送信） |

### GitHub Environments

- `production` 環境を作成し、Protection Rules で承認者を設定

## ディレクトリ構造

```
kozokaai-mailmagazine-sender/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── draft/              # メール編集（ローカル）
│   │   ├── archives/           # アーカイブ閲覧
│   │   ├── import/             # Contact インポート UI
│   │   └── help/               # ヘルプ
│   ├── components/
│   │   └── email/              # メール用コンポーネント（10個）
│   ├── lib/                    # SDK初期化、スキーマ、ユーティリティ（8個）
│   └── scripts/                # CLI・自動化スクリプト（11個）
├── public/
│   ├── MAIL-ASSETS/            # 作業中の画像置き場
│   └── archives/               # メールアーカイブ（YYYY/MM/DD-MSG/）
├── .github/workflows/          # CI/CD（4 Workflow）
└── docs/                       # ドキュメント（唯一の SoT）
```

## ドキュメント

詳細なドキュメントは [`docs/INDEX.md`](./docs/INDEX.md) を参照してください。

| カテゴリ | 主要ドキュメント |
|---------|-----------------|
| 非エンジニア向け | [getting-started.md](./docs/for-non-engineers/getting-started.md), [component-reference.md](./docs/for-non-engineers/component-reference.md) |
| 仕様 | [architecture.md](./docs/specs/architecture.md), [require.md](./docs/specs/require.md) |
| 開発 | [branch.md](./docs/dev/branch.md) |
| 環境構築 | [environment.md](./docs/setup/environment.md) |
| 運用 | [workflow.md](./docs/ops/workflow.md), [troubleshooting.md](./docs/ops/troubleshooting.md) |

## ライセンス

MIT License
