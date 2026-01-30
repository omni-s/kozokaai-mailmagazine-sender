# INDEX.mdドキュメント索引と運用ルール

## 運用原則
- `docs/` は知見とルールの唯一のソース・オブ・トゥルースです。
- `/docs/` 直下に置けるファイルは本索引 `docs/INDEX.md` のみ。他のドキュメントは必ずサブディレクトリに配置します。
- サブディレクトリは必要最小限に留め、命名は `kebab-case` に統一します。
- 追加・更新時は本索引を必ず更新し、重複やリンク切れ、プロジェクトの実情との生合成を定期的にチェックします。
- 機密情報（PII 等）は書き込み禁止。コミット時は `DOC:` プレフィックスを推奨します。

## ディレクトリ構成（最小セット）

```
docs/
├── INDEX.md          # 本索引ファイル
├── for-non-engineers/   # 非エンジニア向けガイド
│   ├── getting-started.md      # 初めてのメール作成（ステップバイステップ）
│   ├── component-reference.md  # コンポーネントリファレンス
│   ├── common-errors.md        # よくあるエラー集
│   └── brand-guide.md          # kozokaAI ブランドガイド
├── dev/              # 開発関連ドキュメント
│   ├── branch.md     # ブランチ戦略とCI/CDワークフロー
│   └── devcontainer.md  # VS Code Dev Container 運用終了について（歴史的記録）
├── setup/            # 環境構築ガイド
│   └── environment.md   # AWS、Resend、GitHub設定
├── ops/              # 運用ガイド
│   ├── workflow.md      # 日常的な配信フロー
│   ├── reply-email.md   # メール返信機能ガイド
│   ├── scheduled-delivery-verification.md  # 予約配信の確認方法
│   ├── troubleshooting.md  # トラブルシューティング
│   ├── security-updates.md # セキュリティアップデート手順
│   ├── todo.md          # 本番環境設定チェックリスト
│   └── actual-configuration.md  # 実際の設定値（.gitignore対象、テンプレート用）
└── specs/            # 仕様関連ドキュメント
    ├── require.md       # 要件定義書
    ├── task.md          # 実装タスクリスト
    └── architecture.md  # システムアーキテクチャ概要
```

## ドキュメント一覧

### 非エンジニア向け（for-non-engineers/）

- **[getting-started.md](./for-non-engineers/getting-started.md)** - 初めてのメール作成ガイド
  - Cursor IDE でメールマガジンを作成する基本的な流れ
  - 環境セットアップから配信までのステップバイステップ
  - Hello World サンプル、画像追加、ボタン追加
  - 配信準備（pnpm run commit）と本番配信（Manual Approval）
  - MailContentBody パターン（DRY化、コード重複防止、保守性向上）
  - 作成前・作成中・配信前チェックリスト

- **[component-reference.md](./for-non-engineers/component-reference.md)** - コンポーネントリファレンス
  - メールデザインで使えるコンポーネント（部品）の視覚的リファレンス
  - EmailWrapper、EmailHeader、EmailSection、EmailCard、EmailHeading、EmailText、EmailButton、Img、EmailDivider
  - EmailHeader: kozokaAI ブランドヘッダーの統一管理（誤削除防止、S3 自動置換）
  - 各コンポーネントの用途、必須プロパティ、デフォルト値、実装例、注意事項
  - コピー＆ペーストできる実装例
  - kozokaAI BOOST マガジンの完全な実装例

- **[common-errors.md](./for-non-engineers/common-errors.md)** - よくあるエラー集
  - メールが表示されない（構文エラー、previewText 未設定、インポート漏れ）
  - 画像が表示されない（ファイル名のタイポ、画像パスの誤り、img タグ使用、width/height 未設定）
  - Tailwind CSS クラスが効かない（メールクライアント非対応、インラインスタイルに変換）
  - pnpm run commit エラー（draft/page.tsx が見つからない、MAIL-ASSETS/ に画像がない、Segment ID が不正）
  - GitHub Actions エラー（Lint エラー、型エラー、S3 アップロードエラー、テストメール送信エラー）
  - 診断フローチャート付き

- **[brand-guide.md](./for-non-engineers/brand-guide.md)** - kozokaAI ブランドガイド
  - 会社情報（会社名、送信者情報、Web サイト、住所）
  - 製品ラインナップ（FAX受注入力AI、商談ログAI、インサイトAI）
  - ブランドカラー（プライマリ #00ADAA、ホバー #009A97）
  - タイポグラフィ（見出し 18px、本文 15px、小さいテキスト 13px）
  - トーン＆マナー（「です・ます」調、プロフェッショナルで親しみやすい）
  - 画像サイズ（ヘッダー 560×293px、フッター 200×105px）
  - 必須構成要素（プレビューテキスト、フッター署名、配信停止リンク）
  - 配信前チェックリスト

### 開発関連（dev/）

- **[branch.md](./dev/branch.md)** - ブランチ運用戦略とGitHub ActionsによるCI/CDワークフローのテンプレート
  - ブランチ命名規則とライフサイクル
  - GitHub Actionsワークフローの設定例
  - コミットメッセージ規約
  - 運用フロー例とトラブルシューティング

- **[devcontainer.md](./dev/devcontainer.md)** - VS Code Dev Container 運用終了について
  - 運用終了の理由（permissions問題、プラットフォーム不一致）
  - 現在の推奨環境（ローカル開発）
  - 過去の設定（参考）

### 環境構築（setup/）

- **[environment.md](./setup/environment.md)** - 環境構築ガイド
  - AWS S3バケット設定（パブリックアクセス、CORS、IAM）
  - Resend API設定（APIキー、Audience作成、From Email検証）
  - GitHub Secrets設定（8項目の環境変数）
  - GitHub Environments設定（production環境、Manual Approval）
  - ローカル開発環境（.env設定、Node.js要件）

### 運用関連（ops/）

- **[workflow.md](./ops/workflow.md)** - 日常的なメール配信フロー
  - ローカル制作 → アーカイブ → レビュー → 本番配信のステップバイステップ
  - ブランチ戦略との統合（main直接push vs feature ブランチ）
  - 配信停止機能（Unsubscribe機能、FTC/GDPR対応、トラブルシューティング）
  - 緊急停止手順
  - 配信履歴の確認方法

- **[reply-email.md](./ops/reply-email.md)** - メール返信機能ガイド
  - 受信者からの返信に対して個別に返信メールを送信
  - Resend Emails API の使用（replyTo パラメータ）
  - 対話型CLI（inquirer）による入力インターフェース
  - 件名に "Re:" プレフィックス自動追加
  - トラブルシューティング（送信エラー、エディタ問題、スレッド化）
  - FAQ（自動返信、複数宛先、プレーンテキスト、React コンポーネント）

- **[scheduled-delivery-verification.md](./ops/scheduled-delivery-verification.md)** - 予約配信の確認方法
  - GitHub Actions ワークフロー確認（即座）
  - Resend Dashboard での配信ログ確認（中期）
  - S3 での config.json 確認（長期）
  - sentAt 更新メカニズムと重複送信防止
  - 配信失敗時のトラブルシューティング
  - 手動再配信手順

- **[troubleshooting.md](./ops/troubleshooting.md)** - トラブルシューティング
  - pnpm run commit エラー対処
  - GitHub Actions エラー対処（Check、Staging、Production）
  - 画像が表示されない問題の診断
  - メールが届かない問題の診断
  - config.json エラーの解読方法

- **[security-updates.md](./ops/security-updates.md)** - セキュリティアップデート手順
  - 依存関係の脆弱性対応フロー（検出 → 影響確認 → 更新 → 検証）
  - 破壊的変更への対応パターン（Tailwind CSS、@react-email/render、Resend SDK等）
  - 頻出パターン集とトラブルシューティング
  - 脆弱性対応履歴（CVE-2025-55182: React2Shell等）

- **[todo.md](./ops/todo.md)** - 本番環境設定と初回配信チェックリスト
  - 本番環境への設定（AWS S3、Resend、GitHub Secrets、Environments）
  - デプロイテスト（ローカル確認、アーカイブ作成、GitHub Actions確認）
  - 初回配信（メールマガジン第1号制作、レビュー、Manual Approval）
  - 運用開始後の定期メンテナンス

- **[actual-configuration.md](./ops/actual-configuration.md)** - 実際の設定値管理（テンプレート）
  - AWS S3設定（バケット名、リージョン、IAMユーザー名）
  - Resend API設定（Segment ID、From Email、検証済みドメイン、Reviewer Email）
  - GitHub Secrets一覧とEnvironments設定
  - pnpm設定（version、pnpm/action-setup version）
  - 次回配信時のチェックリスト
  - ⚠️ 注意: 本ファイルは `.gitignore` で管理対象外（機密情報保護のため）

### 仕様関連（specs/）

- **[require.md](./specs/require.md)** - Resendメール配信システム要件定義書
  - プロジェクト概要と技術スタック
  - ユーザーワークフロー（ローカル制作、レビュー、配信フェーズ）
  - アーカイブ構造と画像パス置換ロジック
  - 宛先管理（config.json）と緊急停止機能
  - 実装ステップとTODO

- **[task.md](./specs/task.md)** - 実装タスクリスト
  - 11個の実装タスク（チェックリスト形式）
  - 実装優先順位（MVP → 拡張機能 → 補完）
  - タスク間の依存関係
  - 進捗管理

- **[architecture.md](./specs/architecture.md)** - システムアーキテクチャ概要
  - 全体フロー（ローカル制作 → S3 → テスト → 本番配信）
  - 技術スタック詳細と選定理由
  - 画像パス置換ロジック（開発時 `/MAIL-ASSETS/` → 本番 S3 URL）
  - メールHTML互換性設計（EmailWrapper テーブルレイアウト）
  - Resend Audience ID管理の仕組み
  - sentAt タイムスタンプ管理
  - Manual Approval（二重チェック機構）
  - 配信停止メカニズム（Unsubscribe、FTC/GDPR対応、自動スキップ処理）

## 更新手順（PDCA）
1. PLAN: 既存の配置と命名を本索引で確認し、追加箇所を決める。
2. DO: 対応するサブディレクトリに Markdown を作成・更新し、本索引へ追記。
3. CHECK: リンク・命名・重複・文責の整合を確認。
4. ACTION: 改善点を洗い出し、必要ならルールやテンプレートを強化する。

---

最終更新日: 2026-01-21