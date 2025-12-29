# Resendメール配信システム 実装タスクリスト

**基準ドキュメント:** `docs/specs/require.md`
**実装計画:** `/Users/m-yamashita/.claude/plans/peaceful-gliding-pillow.md`

## 実装優先順位

### MVP（最小限の動作）

タスク1〜5で「ローカル制作 → アーカイブ → バリデーション」が動作

### 拡張機能（レビュー・配信フロー）

タスク6〜9で「レビュー → 配信」の全フローが完成

### 補完

タスク10〜11で最終仕上げ

---

## タスクリスト

### タスク1: プロジェクト初期化

**目的:** Next.js環境とベース依存関係の構築
**依存関係:** なし

- [x] `package.json` 作成・初期化（Next.js 14+, TypeScript, React 18+）
- [x] 依存関係インストール
  - [x] Core: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`
  - [x] Email: `resend`, `@react-email/render`, `@react-email/components`
  - [x] AWS: `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`
  - [x] CLI: `inquirer`, `@types/inquirer`, `chalk`
  - [x] Validation: `zod`
  - [x] Util: `date-fns`
  - [x] DevDep: `tsx`
- [x] `tsconfig.json` 作成（Next.js推奨設定）
- [x] `next.config.js` 作成（基本設定）
- [x] `.env.example` 作成（RESEND_API_KEY, AWS_*, S3_*, REVIEWER_EMAIL）
- [x] `.gitignore` 更新（.env, node_modules, .next）

**成果物:** `package.json`, `tsconfig.json`, `next.config.js`, `.env.example`

---

### タスク2: 基本ディレクトリ・コンポーネント作成

**目的:** メールテンプレート編集環境の構築
**依存関係:** タスク1

- [x] ディレクトリ作成
  - [x] `src/app/draft`
  - [x] `src/components/email`
  - [x] `src/lib`
  - [x] `src/scripts`
  - [x] `public/mail-assets`
  - [x] `public/archives`
- [x] `src/components/email/Img.tsx` 作成（画像パス解決用）
- [x] `src/components/email/EmailWrapper.tsx` 作成（共通レイアウト）
- [x] `src/app/draft/page.tsx` 初期テンプレート作成（サンプルデザイン）
- [x] `src/app/layout.tsx` 作成（Next.js必須）
- [x] `src/app/page.tsx` 作成（Next.js必須）

**成果物:** `Img.tsx`, `EmailWrapper.tsx`, `draft/page.tsx`, `layout.tsx`, `page.tsx`

---

### タスク3: Zodスキーマ・Resend/S3初期化

**目的:** 外部サービス連携とバリデーション基盤
**依存関係:** タスク1

- [x] `src/lib/config-schema.ts` 作成
  - [x] Zodスキーマ定義（subject, audienceId, sentAt）
  - [x] Config型エクスポート
- [x] `src/lib/resend.ts` 作成
  - [x] Resend SDK初期化
  - [x] RESEND_API_KEY 環境変数読み込み
- [x] `src/lib/s3.ts` 作成
  - [x] S3 Client初期化
  - [x] アップロード用ヘルパー関数

**成果物:** `config-schema.ts`, `resend.ts`, `s3.ts`

---

### タスク4: CLIツール実装（pnpm run commit）

**目的:** ローカル制作完了後の自動アーカイブ・コミット
**依存関係:** タスク2, タスク3

- [x] `src/scripts/commit.ts` 作成
  - [x] 対話型入力実装（inquirer）
    - [x] コミットメッセージ
    - [x] メール件名
    - [x] Resend Audience ID
  - [x] 日付取得（date-fns: YYYY/MM/DD）
  - [x] アーカイブディレクトリ作成（`public/archives/{YYYY}/{MM}/{DD-MSG}/`）
  - [x] ファイル移動
    - [x] `src/app/draft/page.tsx` → `archives/{YYYY}/{MM}/{DD-MSG}/mail.tsx`
    - [x] `public/mail-assets/*` → `archives/{YYYY}/{MM}/{DD-MSG}/assets/`
  - [x] `config.json` 生成（subject, audienceId, sentAt: null）
  - [x] `src/app/draft/page.tsx` を初期テンプレートにリセット
  - [x] Git操作自動化（add, commit, push）
- [x] `package.json` の `scripts` に `commit` コマンド追加

**成果物:** `src/scripts/commit.ts`, `package.json`（scripts更新）

---

### タスク5: バリデーションスクリプト

**目的:** GitHub Actions Check Workflowで使用
**依存関係:** タスク3

- [x] `src/scripts/validate-archive.ts` 作成
  - [x] 新規archiveディレクトリ検出（git diff）
  - [x] config.json検証（Zodスキーマ）
  - [x] 画像パス検証（mail.tsx内のImgタグパース、assets/配下実在確認）
  - [x] Resend Audience ID検証（API呼び出し）
  - [x] エラー時: 詳細メッセージ出力、終了コード1
  - [x] 正常時: 終了コード0

**成果物:** `src/scripts/validate-archive.ts`

---

### タスク6: S3アップロードスクリプト

**目的:** GitHub Actions Staging Workflowで使用
**依存関係:** タスク3

- [x] `src/scripts/upload-to-s3.ts` 作成
  - [x] 新規archiveディレクトリ検出
  - [x] 画像アップロード
    - [x] `archives/{YYYY}/{MM}/{DD-MSG}/assets/*` を列挙
    - [x] S3へアップロード（Key, ACL: public-read, ContentType自動判定）
  - [x] 進捗表示（chalk）
  - [x] エラーハンドリング（詳細ログ、終了コード1）

**成果物:** `src/scripts/upload-to-s3.ts`

---

### タスク7: テスト送信スクリプト

**目的:** GitHub Actions Staging Workflowで使用
**依存関係:** タスク3, タスク6

- [x] `src/scripts/send-test-email.ts` 作成
  - [x] 新規archiveディレクトリ検出
  - [x] React → HTML変換（@react-email/render）
  - [x] 画像パス置換（`/mail-assets/` → S3 URL）
  - [x] テストメール送信
    - [x] 宛先: REVIEWER_EMAIL
    - [x] 件名: `[TEST] {config.json の subject}`
    - [x] 本文: 生成されたHTML
  - [x] 結果出力（送信ID、成功/失敗ログ）

**成果物:** `src/scripts/send-test-email.ts`

---

### タスク8: 本番配信スクリプト

**目的:** GitHub Actions Production Workflowで使用
**依存関係:** タスク3, タスク7

- [x] `src/scripts/send-production-email.ts` 作成
  - [x] 新規archiveディレクトリ検出
  - [x] React → HTML変換（タスク7同様）
  - [x] 本番配信
    - [x] config.json から audienceId 読み込み
    - [x] Resend API で一斉送信
  - [x] config.json更新
    - [x] sentAt に送信日時（ISO 8601）記録
    - [x] ファイル書き込み
    - [x] Git commit & push
  - [x] 結果出力（送信ID、配信件数、成功/失敗ログ）

**成果物:** `src/scripts/send-production-email.ts`

---

### タスク9: GitHub Actions Workflows作成

**目的:** CI/CDパイプライン構築
**依存関係:** タスク5, タスク6, タスク7, タスク8

- [x] `.github/workflows/check.yml` 作成
  - [x] Trigger: push to main, feature/**
  - [x] Jobs: Setup Node.js, pnpm install --frozen-lockfile, lint, type-check, build, validate-archive
  - [x] 環境変数: RESEND_API_KEY
- [x] `.github/workflows/staging.yml` 作成
  - [x] Trigger: pull_request (opened, synchronize)
  - [x] Jobs: Setup Node.js, pnpm install --frozen-lockfile, upload-to-s3, send-test-email
  - [x] 環境変数: AWS_*, S3_*, RESEND_API_KEY, REVIEWER_EMAIL
- [x] `.github/workflows/production.yml` 作成
  - [x] Trigger: push to main（マージ後）
  - [x] Environment: production（Protection Rules設定）
  - [x] Jobs: Manual Approval待機, Setup Node.js, pnpm install --frozen-lockfile, send-production-email
  - [x] 環境変数: Staging同様
- [x] `package.json` の `scripts` に追加
  - [x] `lint`: `next lint`
  - [x] `type-check`: `tsc --noEmit`

**成果物:** `check.yml`, `staging.yml`, `production.yml`, `package.json`（scripts更新）

---

### タスク10: ShadcnUI導入（任意）

**目的:** UIコンポーネントライブラリの追加
**依存関係:** タスク2

- [x] ShadcnUI初期化（`npx shadcn-ui@latest init`）
- [x] 必要なコンポーネント追加（例: Button, Card）
- [x] `src/app/draft/page.tsx` でShadcnUIコンポーネント使用例追加

**成果物:** `components/ui/*`, `components.json`

**備考:** メールHTML内では使用しない（Reactコンポーネントとして使用）

---

### タスク11: ドキュメント更新

**目的:** 実装内容の知見をドキュメント化
**依存関係:** タスク1〜10完了後

- [x] `docs/specs/task.md` 作成（本タスクリスト）
- [x] `docs/INDEX.md` 更新（task.mdへのリンク追加）
- [x] `README.md` 更新
  - [x] プロジェクト概要
  - [x] セットアップ手順
  - [x] 使い方（pnpm run dev, pnpm run commit）

**成果物:** `task.md`, `INDEX.md`（更新）, `README.md`（更新）

---

## 進捗管理

- **現在のフェーズ:** **全タスク完了（実装フェーズ終了）**
  - ✅ `docs/specs/task.md` 作成済み
  - ✅ `docs/INDEX.md` 更新済み
  - ✅ `README.md` 更新済み

- **次のステップ:** 知見のドキュメント化と運用体制整備

---

## 参考リンク

- **要件定義書:** `docs/specs/require.md`
- **実装計画:** `/Users/m-yamashita/.claude/plans/peaceful-gliding-pillow.md`
- **ブランチ戦略:** `docs/dev/branch.md`
- **ドキュメント索引:** `docs/INDEX.md`
