# 本番環境設定と初回配信チェックリスト

本ドキュメントは、Resendメール配信システムの本番環境設定と初回配信までのチェックリストです。

**対象**: 実装完了後、本番運用を開始する前の設定作業

---

## 進捗状況

- **現在のフェーズ**: 実装完了、本番環境設定待ち
- **次のステップ**: 本番環境設定 → デプロイテスト → 初回配信

---

## 1. 本番環境への設定

### 1.1. AWS S3バケット設定

- [ ] **S3バケット作成**
  - バケット名を決定（例: `kozokaai-MAIL-ASSETS`）
  - リージョンを選択（推奨: `ap-northeast-1`）
  - パブリックアクセスのブロックを全て解除
  - **参照**: [docs/setup/environment.md - 1.1. S3バケット作成](../setup/environment.md#11-s3バケット作成)

- [ ] **パブリックアクセス設定**
  - バケットポリシーを設定（読み取り専用公開）
  - **参照**: [docs/setup/environment.md - 1.2. パブリックアクセス設定](../setup/environment.md#12-パブリックアクセス設定)

- [ ] **CORS設定**
  - CORS設定を追加（メールクライアント対応）
  - **参照**: [docs/setup/environment.md - 1.3. CORS設定](../setup/environment.md#13-cors設定)

- [ ] **IAMユーザー作成**
  - IAMユーザーを作成（例: `github-actions-mail-uploader`）
  - ポリシーをアタッチ（`s3:PutObject`, `s3:PutObjectAcl`）
  - アクセスキーを発行（Access Key ID, Secret Access Key）
  - **参照**: [docs/setup/environment.md - 1.4. IAMユーザー作成とポリシー設定](../setup/environment.md#14-iamユーザー作成とポリシー設定)

- [ ] **S3バケットURL確認**
  - S3バケットのURLを確認・記録
  - 形式: `https://{bucket-name}.s3.{region}.amazonaws.com`
  - **参照**: [docs/setup/environment.md - 1.5. S3バケットURL確認](../setup/environment.md#15-s3バケットurl確認)

---

### 1.2. Resend API設定

- [ ] **Resendアカウント作成**
  - https://resend.com でアカウント作成
  - **参照**: [docs/setup/environment.md - 2.1. Resendアカウント作成](../setup/environment.md#21-resendアカウント作成)

- [ ] **APIキー発行**
  - Resend Dashboard → API Keys → Create API Key
  - Permission: Full access
  - APIキーをコピー・保管（例: `re_abc123...`）
  - **参照**: [docs/setup/environment.md - 2.2. APIキー発行](../setup/environment.md#22-apiキー発行)

- [ ] **Audience（配信リスト）作成**
  - Resend Dashboard → Audiences → Create Audience
  - Name, Description を設定
  - Audience IDをコピー・保管（例: `aud_abc123...`）
  - **参照**: [docs/setup/environment.md - 2.3. Audience（配信リスト）作成](../setup/environment.md#23-audience配信リスト作成)

- [ ] **From Email検証**
  - オプション1: ドメイン検証（推奨）
    - Resend Dashboard → Domains → Add Domain
    - DNSレコード（SPF, DKIM, DMARC）を追加
    - 検証完了確認
  - オプション2: テスト用アドレス使用
    - `onboarding@resend.dev` を使用（開発時のみ）
  - **参照**: [docs/setup/environment.md - 2.4. From Email検証](../setup/environment.md#24-from-email検証)

- [ ] **テスト送信の確認方法を把握**
  - Resend Dashboard → Emails で送信ログ確認方法を理解
  - **参照**: [docs/setup/environment.md - 2.5. テスト送信の確認方法](../setup/environment.md#25-テスト送信の確認方法)

---

### 1.3. GitHub Secrets設定

- [ ] **GitHub Secrets登録画面にアクセス**
  - リポジトリ Settings → Secrets and variables → Actions
  - **参照**: [docs/setup/environment.md - 3.1. Secrets設定画面へのアクセス](../setup/environment.md#31-secrets設定画面へのアクセス)

- [ ] **必須Secretsを登録（8項目）**
  - [ ] `RESEND_API_KEY` - Resend APIキー
  - [ ] `RESEND_FROM_EMAIL` - 送信元メールアドレス
  - [ ] `REVIEWER_EMAIL` - テストメール受信者
  - [ ] `AWS_ACCESS_KEY_ID` - AWS IAMアクセスキー
  - [ ] `AWS_SECRET_ACCESS_KEY` - AWS IAMシークレットキー
  - [ ] `AWS_REGION` - S3リージョン（例: `ap-northeast-1`）
  - [ ] `S3_BUCKET_NAME` - S3バケット名
  - [ ] `S3_BUCKET_URL` - S3ベースURL
  - **参照**: [docs/setup/environment.md - 3.2. 必須Secretsリスト](../setup/environment.md#32-必須secretsリスト)

---

### 1.4. GitHub Environments設定（Manual Approval）

- [ ] **production環境を作成**
  - Settings → Environments → New environment
  - Name: `production`（必ずこの名前）
  - **参照**: [docs/setup/environment.md - 4.2. production環境作成](../setup/environment.md#42-production環境作成)

- [ ] **Protection Rulesを設定**
  - Required reviewers にチェック
  - 承認者を追加（リポジトリオーナーまたは信頼できるメンバー）
  - Wait timer 設定（オプション）
  - **参照**: [docs/setup/environment.md - 4.3. Protection Rules設定](../setup/environment.md#43-protection-rules設定)

- [ ] **Workflow Permissionsを設定**
  - Settings → Actions → General → Workflow permissions
  - Read and write permissions を選択
  - **参照**: [docs/setup/environment.md - 4.4. Workflow Permissions設定](../setup/environment.md#44-workflow-permissions設定)

---

### 1.5. ローカル開発環境

- [ ] **リポジトリクローン**
  - `git clone` 実行（まだの場合）
  - **参照**: [docs/setup/environment.md - 5.1. リポジトリクローン](../setup/environment.md#51-リポジトリクローン)

- [ ] **依存関係インストール**
  - `pnpm install` 実行
  - Node.js 20.x以上が必要
  - **参照**: [docs/setup/environment.md - 5.2. 依存関係インストール](../setup/environment.md#52-依存関係インストール)

- [ ] **.envファイル作成**
  - `cp .env.example .env` 実行
  - 8項目の環境変数を設定
  - **参照**: [docs/setup/environment.md - 5.3. .envファイル作成](../setup/environment.md#53-envファイル作成)

---

## 2. デプロイテスト

### 2.1. ローカル開発環境の動作確認

- [ ] **開発サーバー起動確認**
  - `pnpm run dev` 実行
  - http://localhost:3000 にアクセス
  - ホーム画面が表示されることを確認
  - **参照**: [docs/setup/environment.md - 5.5. 開発サーバー起動確認](../setup/environment.md#55-開発サーバー起動確認)

- [ ] **TypeScript型チェック**
  - `pnpm run type-check` 実行
  - エラーなく完了することを確認
  - **参照**: [docs/setup/environment.md - 6.1. ローカル確認](../setup/environment.md#61-ローカル確認)

- [ ] **ESLint確認**
  - `pnpm run lint` 実行
  - エラーなく完了することを確認
  - **参照**: [docs/setup/environment.md - 6.1. ローカル確認](../setup/environment.md#61-ローカル確認)

- [ ] **ビルド確認**
  - `pnpm run build` 実行
  - エラーなく完了することを確認
  - **参照**: [docs/setup/environment.md - 6.1. ローカル確認](../setup/environment.md#61-ローカル確認)

---

### 2.2. アーカイブ作成テスト

- [ ] **テストメールを制作**
  - `pnpm run dev` で開発サーバー起動
  - http://localhost:3000/draft でプレビュー
  - `src/app/draft/page.tsx` を編集
  - テスト用画像を `public/MAIL-ASSETS/` に配置
  - **参照**: [docs/ops/workflow.md - ステップ1: ローカル制作フェーズ](./workflow.md#ステップ1-ローカル制作フェーズ)

- [ ] **pnpm run commit 実行**
  - `pnpm run commit` を実行
  - コミットメッセージ: `test-email`
  - メール件名: `【テスト】メール配信システムテスト`
  - Resend Audience ID: 作成したAudience IDを入力
  - **参照**: [docs/ops/workflow.md - ステップ2: アーカイブ & コミット](./workflow.md#ステップ2-アーカイブ--コミット)

- [ ] **アーカイブディレクトリ確認**
  - `public/archives/{YYYY}/{MM}/{DD-test-email}/` が作成されたことを確認
  - `mail.tsx`, `assets/`, `config.json` が存在することを確認
  - **参照**: [docs/specs/architecture.md - コンポーネント構成とデータフロー](../specs/architecture.md#コンポーネント構成とデータフロー)

---

### 2.3. GitHub Actions Check Workflow 確認

- [ ] **Check Workflow 起動確認**
  - GitHub リポジトリ → Actions タブ
  - Check Workflow が起動したことを確認
  - **参照**: [docs/ops/workflow.md - 2.4. GitHub Actions Check Workflow 起動確認](./workflow.md#24-github-actions-check-workflow-起動確認)

- [ ] **Check Workflow 成功確認**
  - ESLint, TypeCheck, Build, Validate Archive が全て成功
  - エラーがある場合はトラブルシューティングを参照
  - **参照**: [docs/ops/troubleshooting.md - 2. GitHub Actions エラー](./troubleshooting.md#2-github-actions-エラー)

---

### 2.4. Staging Workflow テスト（feature ブランチ）

- [ ] **feature ブランチ作成**
  - `git checkout -b feature/test-email` 実行
  - **参照**: [docs/ops/workflow.md - ブランチ戦略との統合](./workflow.md#ブランチ戦略との統合)

- [ ] **PR作成**
  - GitHub で Pull Request を作成
  - base: `main`, compare: `feature/test-email`
  - **参照**: [docs/ops/workflow.md - 3.1. GitHub でPR作成](./workflow.md#31-github-でpr作成)

- [ ] **Staging Workflow 起動確認**
  - GitHub Actions → Staging Workflow が自動起動
  - **参照**: [docs/ops/workflow.md - 3.3. Staging Workflow 自動起動](./workflow.md#33-staging-workflow-自動起動)

- [ ] **S3アップロード成功確認**
  - Staging Workflow → upload-to-s3 ステップのログ確認
  - 画像がS3にアップロードされたことを確認
  - **参照**: [docs/setup/environment.md - 6.3. S3アップロードテスト（任意）](../setup/environment.md#63-s3アップロードテスト任意)

- [ ] **テストメール受信確認**
  - `REVIEWER_EMAIL` のメールボックスを開く
  - 件名 `[TEST] 【テスト】メール配信システムテスト` が届いたことを確認
  - デザイン、画像、リンクが正しく表示されることを確認
  - **参照**: [docs/ops/workflow.md - 3.4. レビュアーのメールボックスでデザイン確認](./workflow.md#34-レビュアーのメールボックスでデザイン確認)

---

### 2.5. Production Workflow テスト（Manual Approval）

- [ ] **PRマージ**
  - PR画面で Merge pull request → Confirm merge
  - **参照**: [docs/ops/workflow.md - 4.1. PRマージ](./workflow.md#41-prマージ)

- [ ] **Production Workflow 起動確認**
  - GitHub Actions → Production - Send Email が起動
  - **参照**: [docs/ops/workflow.md - 4.2. Production Workflow 起動](./workflow.md#42-production-workflow-起動)

- [ ] **Manual Approval 画面確認**
  - "Waiting for review" 表示を確認
  - Review deployments ボタンが表示されることを確認
  - **参照**: [docs/ops/workflow.md - 4.3. Manual Approval 画面で承認](./workflow.md#43-manual-approval-画面で承認)

- [ ] **承認 & 本番メール送信**
  - Review deployments → production にチェック → Approve and deploy
  - Workflow が再開し、本番メール送信が実行されることを確認
  - **参照**: [docs/ops/workflow.md - 4.4. 本番メール送信実行](./workflow.md#44-本番メール送信実行)

- [ ] **config.json の sentAt 更新確認**
  - `public/archives/{YYYY}/{MM}/{DD-test-email}/config.json` を確認
  - `sentAt` が null から ISO 8601 形式のタイムスタンプに更新されたことを確認
  - **参照**: [docs/ops/workflow.md - 4.5. 配信完了確認](./workflow.md#45-配信完了確認)

- [ ] **Resend Dashboard で配信ログ確認**
  - Resend Dashboard → Emails で送信ログ確認
  - Status: `delivered` を確認
  - **参照**: [docs/ops/workflow.md - 4.5. 配信完了確認](./workflow.md#45-配信完了確認)

---

## 3. 初回配信

### 3.1. メールマガジン第1号の制作

- [ ] **メールコンテンツ作成**
  - `pnpm run dev` で開発サーバー起動
  - `src/app/draft/page.tsx` を編集
  - 画像を `public/MAIL-ASSETS/` に配置
  - プレビュー確認（http://localhost:3000/draft）
  - **参照**: [docs/ops/workflow.md - ステップ1: ローカル制作フェーズ](./workflow.md#ステップ1-ローカル制作フェーズ)

- [ ] **アーカイブ & コミット**
  - `pnpm run commit` 実行
  - コミットメッセージ、件名、Audience ID 入力
  - Git push 確認
  - **参照**: [docs/ops/workflow.md - ステップ2: アーカイブ & コミット](./workflow.md#ステップ2-アーカイブ--コミット)

---

### 3.2. レビュープロセスの実施

- [ ] **PR作成**
  - feature ブランチで PR作成（推奨）
  - **参照**: [docs/ops/workflow.md - 3.1. GitHub でPR作成](./workflow.md#31-github-でpr作成)

- [ ] **Check Workflow 成功確認**
  - ESLint, TypeCheck, Build, Validate Archive 全て成功
  - **参照**: [docs/ops/workflow.md - 3.2. Check Workflow 結果確認](./workflow.md#32-check-workflow-結果確認)

- [ ] **Staging Workflow でテスト送信**
  - S3アップロード成功
  - テストメール送信成功
  - **参照**: [docs/ops/workflow.md - 3.3. Staging Workflow 自動起動](./workflow.md#33-staging-workflow-自動起動)

- [ ] **レビュアー確認**
  - `REVIEWER_EMAIL` でメール受信
  - デザイン、画像、リンク、スマホ表示を確認
  - 必要に応じて修正 → 再送信
  - **参照**: [docs/ops/workflow.md - 3.4. レビュアーのメールボックスでデザイン確認](./workflow.md#34-レビュアーのメールボックスでデザイン確認)

- [ ] **PR承認**
  - デザインが完成したら PR を承認
  - **参照**: [docs/ops/workflow.md - 3.6. PR承認](./workflow.md#36-pr承認)

---

### 3.3. Manual Approval → 本番配信

- [ ] **PRマージ**
  - main ブランチへマージ
  - **参照**: [docs/ops/workflow.md - 4.1. PRマージ](./workflow.md#41-prマージ)

- [ ] **Production Workflow 起動確認**
  - GitHub Actions で起動確認
  - **参照**: [docs/ops/workflow.md - 4.2. Production Workflow 起動](./workflow.md#42-production-workflow-起動)

- [ ] **Manual Approval で最終確認**
  - 配信先 Audience が正しいか確認
  - 件名、本文に誤りがないか最終確認
  - **参照**: [docs/specs/architecture.md - Manual Approval（二重チェック機構）](../specs/architecture.md#manual-approval二重チェック機構)

- [ ] **承認ボタン押下**
  - Review deployments → Approve and deploy
  - **参照**: [docs/ops/workflow.md - 4.3. Manual Approval 画面で承認](./workflow.md#43-manual-approval-画面で承認)

- [ ] **本番配信完了確認**
  - Production Workflow 成功確認
  - `config.json` の `sentAt` 更新確認
  - Resend Dashboard で配信ログ確認
  - **参照**: [docs/ops/workflow.md - 4.5. 配信完了確認](./workflow.md#45-配信完了確認)

---

## 4. 運用開始後

### 4.1. 日常的な配信フロー確立

- [ ] **ワークフロードキュメント確認**
  - 日常的な配信フローを理解
  - **参照**: [docs/ops/workflow.md](./workflow.md)

- [ ] **トラブルシューティング確認**
  - よくあるエラーと対処法を把握
  - **参照**: [docs/ops/troubleshooting.md](./troubleshooting.md)

---

### 4.2. 定期的なメンテナンス

- [ ] **Resend Dashboard 定期確認**
  - 配信ログ、エラーログ確認
  - バウンス率、スパム判定率確認
  - **参照**: [docs/ops/troubleshooting.md - 4. メールが届かない](./troubleshooting.md#4-メールが届かない)

- [ ] **GitHub Actions Workflow 定期確認**
  - Check, Staging, Production の実行履歴確認
  - エラーが発生していないか確認
  - **参照**: [docs/ops/troubleshooting.md - 2. GitHub Actions エラー](./troubleshooting.md#2-github-actions-エラー)

- [ ] **S3ストレージ使用量確認**
  - AWS S3 → バケット → メトリクス
  - 使用量が増えすぎていないか確認
  - 古いアーカイブの削除検討（必要に応じて）

---

## トラブルシューティング

設定中にエラーが発生した場合は、以下を参照してください。

- **環境構築ガイド**: [docs/setup/environment.md - トラブルシューティング](../setup/environment.md#トラブルシューティング)
- **運用トラブルシューティング**: [docs/ops/troubleshooting.md](./troubleshooting.md)
- **システムアーキテクチャ**: [docs/specs/architecture.md](../specs/architecture.md)

---

## 関連ドキュメント

- **環境構築ガイド**: [docs/setup/environment.md](../setup/environment.md)
- **運用ガイド**: [docs/ops/workflow.md](./workflow.md)
- **トラブルシューティング**: [docs/ops/troubleshooting.md](./troubleshooting.md)
- **システムアーキテクチャ**: [docs/specs/architecture.md](../specs/architecture.md)
- **実装タスクリスト**: [docs/specs/task.md](../specs/task.md)

---

最終更新日: 2025-12-19
