# Resend メール配信システム

マーケティング担当者がCursor IDE + AIでHTMLメールをデザイン・実装し、GitOpsフローで安全にメールマガジンを配信するシステムです。

## 概要

このプロジェクトは、ノーコード/ローコード時代において、マーケティング担当者が技術的な知識がなくてもメールマガジンを作成・配信できることを目指しています。

### 主な機能

- **ローカル編集**: Next.jsの開発サーバーでリアルタイムプレビューしながらメールをデザイン
- **GitOps配信**: GitHub PRベースのレビューフローで安全に本番配信
- **自動検証**: GitHub Actionsによる自動Lint、型チェック、画像パス検証
- **テスト送信**: PR作成時に自動でレビュアーへテストメール送信
- **Manual Approval**: 本番配信前に上長の承認が必須

## 技術スタック

### Frontend/Template
- **Next.js**: 15.1.3 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.7.2

### Email Platform
- **Resend API**: メール配信プラットフォーム（SDK v6.6.0）
- **@react-email/render**: React → HTML変換（v2.0.0）
- **@react-email/components**: メール用Reactコンポーネント

### Infrastructure
- **AWS S3**: 画像アセット配信（SDK v3使用）
- **GitHub Actions**: CI/CD

### UI
- **Tailwind CSS**: 3.4.17
- **ShadcnUI**: UIコンポーネントライブラリ
- **clsx + tailwind-merge**: クラス名管理

### CLI & Validation
- **inquirer**: 対話型CLI
- **chalk**: ターミナル出力の色付け
- **date-fns**: 日付処理
- **Zod**: スキーマ検証

## ディレクトリ構造

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
│   │   │   ├── EmailWrapper.tsx
│   │   │   └── Img.tsx
│   │   └── ui/                 # ShadcnUI コンポーネント
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── resend.ts           # Resend SDK初期化
│   │   ├── s3.ts               # S3 SDK初期化
│   │   ├── config-schema.ts    # config.json Zodスキーマ
│   │   └── utils.ts            # Tailwind utilities
│   └── scripts/                # CLI・自動化スクリプト
│       ├── commit.ts           # npm run commit
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
│       ├── check.yml
│       ├── staging.yml
│       └── production.yml
├── docs/                       # ドキュメント
│   ├── INDEX.md
│   ├── specs/
│   │   ├── require.md
│   │   └── task.md
│   └── dev/
│       └── branch.md
└── README.md                   # 本ファイル
```

## セットアップ

### オプション1: devcontainer を使用（推奨）

チーム全体で統一された開発環境を利用できます。

#### 前提条件

- Docker Desktop がインストールされていること
- VS Code + Dev Containers 拡張機能（`ms-vscode-remote.remote-containers`）

#### 起動手順

1. **VS Code でプロジェクトを開く**
   ```bash
   code .
   ```

2. **Dev Containerで再起動**
   - Command Palette（`Cmd+Shift+P` / `Ctrl+Shift+P`）→ **「Dev Containers: Reopen in Container」** を実行
   - または、VS Codeが自動検出した「Reopen in Container」通知をクリック

3. **コンテナビルド完了を待つ**（初回のみ5〜10分）

4. **環境変数ファイル作成**
   ```bash
   cp .env.example .env
   # .env を編集してAPI キー等を設定
   ```

5. **開発サーバー起動**
   ```bash
   npm run dev
   ```
   - ブラウザで http://localhost:3000 を開く

詳細は [docs/dev/devcontainer.md](./docs/dev/devcontainer.md) を参照してください。

---

### オプション2: ローカル環境を使用

#### 1. 依存関係インストール

```bash
npm install
```

#### 2. 環境変数設定

`.env.example` をコピーして `.env` を作成し、以下の環境変数を設定してください。

```bash
cp .env.example .env
```

**必須環境変数:**

```
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
```

#### 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 使い方

### ローカル制作

1. http://localhost:3000/draft でメールをデザイン
2. 画像は `public/mail-assets/` に配置
3. ブラウザでプレビュー確認
4. 完成したら以下のコマンドを実行

```bash
npm run commit
```

対話形式で以下を入力します:
- コミットメッセージ（例: `summer-sale`）
- メール件名（例: `【サマーセール】最大50%OFFのお知らせ`）
- 配信対象の宛先リスト（Resend Audience IDを選択）

スクリプトが自動的に:
- アーカイブディレクトリを作成（例: `public/archives/2024/05/20-summer-sale/`）
- メールテンプレートと画像を移動
- `config.json` を生成
- Git commit & push を実行

### レビュー・配信フロー

#### 1. PR作成
- ローカルでブランチを切っている場合はPR作成
- `main` に直接pushした場合はスキップ

#### 2. GitHub Actions が自動実行
- **Check Workflow**: Lint, Type Check, Build, Validation
- **Staging Workflow**: S3 Upload, Test Email Send（レビュアーへ）

#### 3. レビュー承認 → マージ

#### 4. 本番配信
- **Production Workflow** が起動
- **Manual Approval** が必須（上長が承認ボタンを押下）
- 承認後、Resend Audience へ一斉送信
- `config.json` の `sentAt` タイムスタンプを自動更新

## GitHub Actions Workflows

### check.yml
**Trigger**: `main`, `feature/**` へのPush

**処理内容**:
- ESLint実行
- TypeScript型チェック
- Next.jsビルド
- アーカイブバリデーション（config.json、画像パス、Audience ID確認）

### staging.yml
**Trigger**: Pull Request作成・更新

**処理内容**:
- 新規追加されたarchiveディレクトリを検出
- 画像をS3へアップロード（public-read）
- React → HTML変換
- テストメール送信（`REVIEWER_EMAIL` へ）

### production.yml
**Trigger**: `main` へのマージ

**処理内容**:
- **Manual Approval待機**（GitHub Environments機能）
- React → HTML変換
- Resend Audience へ一斉送信
- `config.json` の `sentAt` を更新してコミット

## npm scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "commit": "tsx src/scripts/commit.ts"
}
```

## 環境変数

### ローカル開発用

- `RESEND_API_KEY`: Resend APIキー
- `RESEND_FROM_EMAIL`: 送信元メールアドレス
- `AWS_ACCESS_KEY_ID`: AWS アクセスキーID
- `AWS_SECRET_ACCESS_KEY`: AWS シークレットアクセスキー
- `AWS_REGION`: AWS リージョン（例: `ap-northeast-1`）
- `S3_BUCKET_NAME`: S3バケット名
- `S3_BUCKET_URL`: S3バケットのベースURL
- `REVIEWER_EMAIL`: テストメール送信先

### GitHub Actions用

上記に加えて、GitHub Secretsに以下を設定してください:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `S3_BUCKET_URL`
- `REVIEWER_EMAIL`

また、GitHub Environmentsで `production` 環境を作成し、Protection Rulesで承認者を設定してください。

## ドキュメント

プロジェクトの詳細なドキュメントは `docs/` ディレクトリに格納されています。

- **[docs/INDEX.md](./docs/INDEX.md)**: ドキュメント索引
- **[docs/specs/require.md](./docs/specs/require.md)**: 要件定義書
- **[docs/specs/task.md](./docs/specs/task.md)**: 実装タスクリスト
- **[docs/dev/branch.md](./docs/dev/branch.md)**: ブランチ戦略とCI/CD

## ワークフロー図

```
ローカル制作
    ↓
npm run commit（アーカイブ・Git push）
    ↓
PR作成（任意）
    ↓
Check Workflow（Lint, Type Check, Build, Validation）
    ↓
Staging Workflow（S3 Upload, Test Email Send）
    ↓
レビュー・承認 → マージ
    ↓
Production Workflow（Manual Approval待機）
    ↓
承認ボタン押下
    ↓
本番配信（Resend Audience へ一斉送信）
    ↓
sentAt 自動更新
```

## ライセンス

MIT License

## 参考リンク

- [Resend公式ドキュメント](https://resend.com/docs)
- [Next.js公式ドキュメント](https://nextjs.org/docs)
- [@react-email/render](https://react.email/docs/utilities/render)
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
