# Resendメール配信システム 要件定義書

## 1. プロジェクト概要

社内マーケティング担当者が、Cursor IDEとAIを活用してHTMLメールをデザイン・実装し、GitOpsフローを通じて安全かつ確実にメールマガジンを配信するシステム。

### 主要技術スタック

- **Frontend/Template**: Next.js (App Router), TypeScript, ShadcnUI
- **Email Platform**: Resend API
- **Infrastructure**: AWS S3 (アセット配信), GitHub Actions (CI/CD)
- **Editor**: Cursor IDE (AI支援によるコーディング)

## 2. ユーザーワークフロー

### 2.1. ローカル制作フェーズ (User: マーケティング担当)

#### 編集

- Next.js開発サーバー (`pnpm run dev`) を起動。
- `src/app/draft/page.tsx` (仮称: 作業用ファイル) を編集。
- 画像は `public/mail-assets/` に配置し、コード内では `/mail-assets/image.png` と指定。
- ブラウザでプレビューを確認しながらデザインを調整。

#### コミット & アーカイブ

編集完了後、`pnpm run commit` コマンドを実行。

**対話形式の入力:**

- コミットメッセージ（ディレクトリ名に使用）
- 配信対象の宛先リスト（ResendのAudience IDを選択または入力）

**自動処理スクリプトの実行:**

- `src/app/draft/page.tsx` と `public/mail-assets/` を `public/archives/{YYYY}/{MM}/{DD-MSG}/` へ移動。
- 宛先情報を記載した `config.json` を同ディレクトリに生成。
- `src/app/draft/page.tsx` を初期テンプレートにリセット。
- `git add .`, `git commit -m "..."`, `git push` を自動実行。

### 2.2. レビューフェーズ (System: GitHub Actions)

#### Push時 (Check)

- Lint (ESLint), Typecheck (TypeScript) を実行。
- **バリデーション:**
  - 画像パスが実在するかチェック。
  - `config.json` の宛先IDがResendに存在するかチェック。

#### Pull Request 作成時 (Staging)

- **アセットアップロード**: 今回追加された archives 内の画像を S3 (Public Read) へアップロード。
- **HTML変換 & パス置換:**
  - ReactコンポーネントをHTML文字列に変換。
  - 画像パス `/mail-assets/...` をS3のURL `https://{bucket}.s3.../archives/...` に置換。
- **テスト送信**: 生成されたHTMLを使用し、指定されたレビュアー（上長）へテストメールを送信。
- **Bot通知**: PRコメントに「テスト送信完了」等のステータスを通知（任意）。

### 2.3. 配信フェーズ (User: 上長 / System: GitHub Actions)

#### 承認

上長はPRの内容とテストメールを確認。問題なければPRを `main` (Releaseブランチ) にマージ。

#### Merge時 (Production)

GitHub Actionsが起動。

- **Environment Protection (二重チェック):**
  - GitHubのデプロイ承認機能により一時停止。
  - 上長が「Approve」ボタンを押下することでジョブが再開。
- **本番配信:**
  - Resend API を叩き、`config.json` で指定された宛先リストに対して一斉送信。

## 3. 機能要件詳細

### 3.1. アーカイブ構造 (S3 & Git)

GitリポジトリおよびS3バケット内は以下の構造で管理する。

```
public/
  └── archives/
       └── 2024/
            └── 05/
                 └── 20-summer-sale/  <-- {DD-コミットメッセージ}
                      ├── mail.tsx    <-- 移動された draft.tsx
                      ├── config.json <-- 宛先情報など
                      └── assets/     <-- 使用画像
                           ├── hero.jpg
                           └── logo.png
```

### 3.2. 画像パス置換ロジック (A案採用)

**開発時**: ユーザーは `<Img src="/mail-assets/hero.jpg" />` と記述。Next.jsのローカルサーバーで正しく表示される。

**ビルド時 (CI):**

- スクリプトがHTML生成時に `src` 属性を解析。
- S3のベースURL `https://{s3-bucket-domain}/archives/{YYYY}/{MM}/{DD-MSG}/assets/hero.jpg` に置換してHTML化する。

### 3.3. 宛先管理 (config.json)

`pnpm run commit` 時に生成される設定ファイル。

```json
{
  "subject": "【サマーセール】最大50%OFFのお知らせ",
  "audienceId": "aud_12345678", 
  "sentAt": null
}
```

### 3.4. 緊急停止（キルスイッチ）

GitHub Environments機能を使用。`production` 環境を作成し、Protection Rulesで「Required reviewers」を設定。Resend APIを叩くジョブはこの `production` 環境に関連付け、承認がないと実行されないようにする。

## 4. 今後のTODO / 実装ステップ

- **Next.js環境構築**: ShadcnUI, Resend SDKの導入。
- **CLIツール開発**: `pnpm run commit` で動く対話型スクリプトの実装 (Node.js script)。
- **CI/CD構築:**
  - Lint/TypeCheckワークフロー
  - S3 Upload & Test Sendワークフロー
  - Production Sendワークフロー (with Approval)
- **S3 & Resend設定**: バケットポリシー設定、APIキー発行。
