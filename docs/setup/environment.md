# 環境構築ガイド

本ドキュメントでは、Resendメール配信システムの環境構築手順を説明します。

## 前提条件

- AWSアカウント（S3バケット作成用）
- Resendアカウント（メール配信用）
- GitHubアカウント（GitHub Actions使用）
- Node.js 20.x以上（ローカル開発用）

---

## 1. AWS S3バケット設定

### 1.1. S3バケット作成

1. **AWS Management Console** にログイン
2. **S3** サービスに移動
3. **バケットを作成** ボタンをクリック

**基本設定**:
- **バケット名**: 任意（例: `kozokaai-mail-assets`）
- **リージョン**: `ap-northeast-1`（東京）推奨
- **バケットタイプ**: **General purpose**（汎用）

**オブジェクト所有者（ACL設定）**:
- **ACL 有効** を選択
- ⚠️ AWS は ACL の代わりにバケットポリシーを推奨していますが、本プロジェクトでは `s3:PutObjectAcl` を使用するため ACL を有効化します

**パブリックアクセス設定**:
- **パブリックアクセスのブロック**: **全てのチェックを外す**（画像公開用）

**その他の設定**:
- **バケットのバージョニング**: 無効（デフォルト）
- **タグ**: オプション（例: `Project=kozokaai-mailmagazine`, `Environment=production`）
- **デフォルトの暗号化**: **SSE-S3**（Amazon S3 マネージドキー）推奨
- **オブジェクトロック**: 無効（デフォルト）

4. **バケットを作成** をクリック

### 1.2. パブリックアクセス設定

バケット作成後、画像を公開するための設定を行います。

#### バケットポリシーの設定

1. 作成したバケットをクリック
2. **アクセス許可** タブ → **バケットポリシー** → **編集**
3. 以下のポリシーを貼り付け（`{bucket-name}` を実際のバケット名に置換）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::{bucket-name}/*"
    }
  ]
}
```

4. **変更を保存**

### 1.3. CORS設定

メールクライアントから画像を読み込むためのCORS設定を行います。

1. **アクセス許可** タブ → **Cross-Origin Resource Sharing (CORS)** → **編集**
2. 以下のCORS設定を貼り付け

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

3. **変更を保存**

### 1.4. IAMユーザー作成とポリシー設定

GitHub Actionsから S3 にアップロードするための IAM ユーザーを作成します。

#### IAMユーザー作成

1. **IAM** サービスに移動
2. **ユーザー** → **ユーザーを追加**
3. **ユーザー名**: 任意（例: `github-actions-mail-uploader`）
4. **アクセスキー - プログラムによるアクセス** にチェック
5. **次のステップ**

#### ポリシーのアタッチ

1. **既存のポリシーを直接アタッチ** を選択
2. **ポリシーの作成** をクリック
3. **JSON** タブを選択し、以下を貼り付け（`{bucket-name}` を実際のバケット名に置換）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::{bucket-name}/*"
    }
  ]
}
```

4. **次のステップ: タグ** → **次のステップ: 確認**
5. **ポリシー名**: 任意（例: `GithubActionsS3UploadPolicy`）
6. **ポリシーの作成**
7. 作成したポリシーを選択し、**次のステップ**
8. **ユーザーの作成**

#### アクセスキー発行

1. ユーザー作成完了画面で、以下をコピーして安全に保管
   - **アクセスキー ID**（例: `AKIA...`）
   - **シークレットアクセスキー**（例: `secret...`）

⚠️ **注意**: シークレットアクセスキーは再表示できないため、必ずコピーして保管してください。

### 1.5. S3バケットURL確認

S3バケットのURLを確認します。

**形式**: `https://{bucket-name}.s3.{region}.amazonaws.com`

**例**: `https://kozokaai-mail-assets.s3.ap-northeast-1.amazonaws.com`

---

## 2. Resend API設定

### 2.1. Resendアカウント作成

1. [Resend公式サイト](https://resend.com) にアクセス
2. **Sign Up** をクリック
3. メールアドレス、パスワードを入力してアカウント作成

### 2.2. APIキー発行

1. Resend Dashboard にログイン
2. **API Keys** → **Create API Key** をクリック
3. **Name**: 任意（例: `Production API Key`）
4. **Permission**: **Full access** を選択
5. **Create** をクリック
6. 表示されたAPIキーをコピーして安全に保管（例: `re_abc123...`）

⚠️ **注意**: APIキーは再表示できないため、必ずコピーして保管してください。

### 2.3. Segment（配信リスト）作成

1. Resend Dashboard → **Segments** → **Create Segment** をクリック
2. **Name**: 任意（例: `Newsletter Subscribers`）
3. **Description**: オプション（例: `メールマガジン購読者リスト`）
4. **Create** をクリック
5. 作成されたSegmentの **Segment ID** をコピー

**Segment ID 形式**:
- `seg_{uuid}` 形式（例: `seg_abc123-def456-ghi789`）
- または単純なUUID形式（例: `a355a0bd-32fa-4ef4-b6d5-7341f702d35b`）

⚠️ **注意**: Resend APIの内部ではSegmentとして管理されますが、一部のAPIパラメータ名（`audienceId`等）は互換性のため従来の名称を維持しています。

### 2.4. From Email検証

#### オプション1: ドメイン検証（推奨）

1. Resend Dashboard → **Domains** → **Add Domain** をクリック
2. **Domain**: 送信元ドメイン（例: `example.com`）
3. **Add Domain** をクリック
4. 表示されたDNSレコード（SPF, DKIM, DMARC）をドメインレジストラに追加
5. DNS伝播後（最大48時間）、Resend Dashboardで **Verify** をクリック

#### オプション2: テスト用アドレス使用（開発時のみ）

Resendの提供するテストアドレス `onboarding@resend.dev` を使用できます。

**制限**:
- テスト送信のみ
- 本番環境では使用不可

### 2.5. テスト送信の確認方法

1. Resend Dashboard → **Emails** に移動
2. 送信されたメールの一覧が表示される
3. **送信ID** をクリックすると詳細（Status, エラーログ等）確認可能

---

## 3. GitHub Secrets設定

### 3.1. Secrets設定画面へのアクセス

1. GitHubリポジトリページに移動
2. **Settings** タブをクリック
3. **Secrets and variables** → **Actions** をクリック
4. **New repository secret** をクリック

### 3.2. 必須Secretsリスト

以下の8項目を登録してください。

| Secret名 | 説明 | 例 |
|---------|------|---|
| `RESEND_API_KEY` | Resend APIキー | `re_abc123...` |
| `RESEND_FROM_EMAIL` | 送信元メールアドレス | `info@example.com` or `onboarding@resend.dev` |
| `REVIEWER_EMAIL` | テストメール受信者 | `reviewer@example.com` |
| `AWS_ACCESS_KEY_ID` | AWS IAMアクセスキー | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAMシークレットキー | `secret...` |
| `AWS_REGION` | S3リージョン | `ap-northeast-1` |
| `S3_BUCKET_NAME` | S3バケット名 | `kozokaai-mail-assets` |
| `S3_BUCKET_URL` | S3ベースURL | `https://kozokaai-mail-assets.s3.ap-northeast-1.amazonaws.com` |

### 3.3. Secrets登録手順

各Secretに対して以下を実行:

1. **New repository secret** をクリック
2. **Name**: 上記表の `Secret名` を入力
3. **Secret**: 対応する値を入力
4. **Add secret** をクリック

---

## 4. GitHub Environments設定（Manual Approval）

### 4.1. Environments画面へのアクセス

1. GitHubリポジトリページ → **Settings** タブ
2. **Environments** をクリック
3. **New environment** をクリック

### 4.2. production環境作成

1. **Name**: `production`（**必ずこの名前にしてください**）
2. **Configure environment** をクリック

### 4.3. Protection Rules設定

**Required reviewers** セクション:
1. ☑ **Required reviewers** にチェック
2. **Add reviewers** をクリック
3. 承認者（リポジトリオーナーまたは信頼できるメンバー）を選択
4. 最大6人まで指定可能

**Wait timer**（オプション）:
- 承認までの待機時間を設定（例: 5分）
- 未設定の場合、無期限待機

**Deployment branches**（オプション）:
- **Selected branches** → `main` を選択
- mainブランチからのデプロイのみ許可

### 4.4. Workflow Permissions設定

Production Workflowが `config.json` を自動更新するために必要です。

1. **Settings** タブ → **Actions** → **General**
2. **Workflow permissions** セクション
3. ☑ **Read and write permissions** を選択
4. **Save** をクリック

---

## 5. ローカル開発環境

### 5.1. リポジトリクローン

```bash
git clone https://github.com/{org}/{repo}.git
cd {repo}
```

### 5.2. 依存関係インストール

```bash
pnpm install
```

**推奨Node.jsバージョン**: 20.x以上（22.x対応）

### 5.3. .envファイル作成

```bash
cp .env.example .env
```

### 5.4. 環境変数設定

`.env` ファイルを開き、以下を設定:

```env
# Resend API
RESEND_API_KEY=re_abc123...
RESEND_FROM_EMAIL=info@example.com

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=secret...
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=kozokaai-mail-assets
S3_BUCKET_URL=https://kozokaai-mail-assets.s3.ap-northeast-1.amazonaws.com

# レビュアー
REVIEWER_EMAIL=reviewer@example.com
```

### 5.5. 開発サーバー起動確認

```bash
pnpm run dev
```

ブラウザで http://localhost:3000 を開き、Next.jsアプリが起動することを確認してください。

---

## 6. 環境構築の確認

### 6.1. ローカル確認

```bash
# TypeScript型チェック
pnpm run type-check

# ESLint
pnpm run lint

# ビルド
pnpm run build
```

すべてエラーなく完了すればOKです。

### 6.2. GitHub Actions確認

1. 適当なファイルを編集してGitHub にpush
2. GitHub Actions タブでCheck Workflowが実行されることを確認
3. すべてのステップが成功すればOK

### 6.3. S3アップロードテスト（任意）

```bash
# S3アップロードスクリプトを直接実行（アーカイブがある場合）
npx tsx src/scripts/upload-to-s3.ts
```

エラーがなければS3設定は完了です。

### 6.4. Resend APIテスト（任意）

```bash
# テストメール送信スクリプトを直接実行（アーカイブがある場合）
npx tsx src/scripts/send-test-email.ts
```

`REVIEWER_EMAIL` にメールが届けばResend設定は完了です。

---

## トラブルシューティング

### AWS S3関連

#### エラー: `Access Denied`

**原因**: IAMユーザーの権限不足

**対処**:
1. IAMポリシーが正しくアタッチされているか確認
2. バケット名が正しいか確認
3. リージョンが一致しているか確認

#### エラー: `The bucket does not allow ACLs`

**原因**: S3バケットのACL設定が無効化されている（本プロジェクトでは`s3:PutObjectAcl`を使用するためACL必須）

**対処**:
1. S3バケット → **アクセス許可** タブ
2. **オブジェクト所有者** セクション → **編集** をクリック
3. **ACL enabled（ACL 有効）** を選択
4. オブジェクト所有権: **Bucket owner preferred**（バケット所有者優先）を選択
5. **変更を保存**
6. 確認ダイアログで警告を読み、**承認** をクリック

⚠️ **AWS警告について**: AWS は ACL の代わりにバケットポリシーを推奨していますが、本プロジェクトのアップロードスクリプト（`src/lib/s3.ts`）は `ACL: 'public-read'` を使用しているため、ACL有効化が必要です。

### Resend API関連

#### エラー: `API key is invalid`

**原因**: APIキーが正しくない、または有効期限切れ

**対処**:
1. Resend Dashboard で新しいAPIキーを発行
2. GitHub Secrets を更新

#### エラー: `Segment not found`

**原因**: Segment IDが存在しない、または形式が不正

**対処**:
1. Resend Dashboard → **Segments** で Segment ID を確認
2. `config.json` の `audienceId` フィールドに正しいSegment IDを設定
3. Segment ID形式: `seg_{uuid}` または UUID形式

#### エラー: `From email is not verified`

**原因**: 送信元メールアドレスが未検証

**対処**:
1. Resend Dashboard → **Domains** でドメイン検証ステータス確認
2. DNS設定（SPF, DKIM, DMARC）が正しいか確認
3. または `onboarding@resend.dev` を使用（テスト用）

### GitHub Actions関連

#### エラー: `Secret not found`

**原因**: GitHub Secrets が設定されていない

**対処**:
1. Settings → Secrets and variables → Actions で全8項目が登録されているか確認
2. Secret名のスペルミスがないか確認

#### エラー: `Resource not accessible by integration`

**原因**: Workflow Permissions が不足

**対処**:
1. Settings → Actions → General → Workflow permissions
2. **Read and write permissions** に変更

### Manual Approval関連

#### エラー: `Environment not found`

**原因**: `production` 環境が存在しない

**対処**:
1. Settings → Environments で `production` 環境を作成
2. **名前は必ず `production`（小文字）**

#### 承認画面が表示されない

**原因**: Protection Rulesが設定されていない

**対処**:
1. Settings → Environments → production
2. **Required reviewers** にチェック、承認者を追加

---

## 関連ドキュメント

- **システムアーキテクチャ**: [docs/specs/architecture.md](../specs/architecture.md)
- **運用ガイド**: [docs/ops/workflow.md](../ops/workflow.md)
- **トラブルシューティング**: [docs/ops/troubleshooting.md](../ops/troubleshooting.md)

---

最終更新日: 2025-12-29
