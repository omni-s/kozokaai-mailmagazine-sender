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
├── dev/              # 開発関連ドキュメント
│   ├── branch.md     # ブランチ戦略とCI/CDワークフロー
│   └── devcontainer.md  # VS Code Dev Container設定と使い方
├── setup/            # 環境構築ガイド
│   └── environment.md   # AWS、Resend、GitHub設定
├── ops/              # 運用ガイド
│   ├── workflow.md      # 日常的な配信フロー
│   └── troubleshooting.md  # トラブルシューティング
└── specs/            # 仕様関連ドキュメント
    ├── require.md       # 要件定義書
    ├── task.md          # 実装タスクリスト
    └── architecture.md  # システムアーキテクチャ概要
```

## ドキュメント一覧

### 開発関連（dev/）

- **[branch.md](./dev/branch.md)** - ブランチ運用戦略とGitHub ActionsによるCI/CDワークフローのテンプレート
  - ブランチ命名規則とライフサイクル
  - GitHub Actionsワークフローの設定例
  - コミットメッセージ規約
  - 運用フロー例とトラブルシューティング

- **[devcontainer.md](./dev/devcontainer.md)** - VS Code Dev Container 設定と使い方
  - Dev Containerの概要と利点
  - セットアップ手順（初回・2回目以降）
  - トラブルシューティング（ポート競合、認証エラー等）
  - カスタマイズガイド（拡張機能追加、ポート設定等）

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
  - 緊急停止手順
  - 配信履歴の確認方法

- **[troubleshooting.md](./ops/troubleshooting.md)** - トラブルシューティング
  - npm run commit エラー対処
  - GitHub Actions エラー対処（Check、Staging、Production）
  - 画像が表示されない問題の診断
  - メールが届かない問題の診断
  - config.json エラーの解読方法

- **[todo.md](./ops/todo.md)** - 本番環境設定と初回配信チェックリスト
  - 本番環境への設定（AWS S3、Resend、GitHub Secrets、Environments）
  - デプロイテスト（ローカル確認、アーカイブ作成、GitHub Actions確認）
  - 初回配信（メールマガジン第1号制作、レビュー、Manual Approval）
  - 運用開始後の定期メンテナンス

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
  - 画像パス置換ロジック（開発時 `/mail-assets/` → 本番 S3 URL）
  - メールHTML互換性設計（EmailWrapper テーブルレイアウト）
  - Resend Audience ID管理の仕組み
  - sentAt タイムスタンプ管理
  - Manual Approval（二重チェック機構）

## 更新手順（PDCA）
1. PLAN: 既存の配置と命名を本索引で確認し、追加箇所を決める。
2. DO: 対応するサブディレクトリに Markdown を作成・更新し、本索引へ追記。
3. CHECK: リンク・命名・重複・文責の整合を確認。
4. ACTION: 改善点を洗い出し、必要ならルールやテンプレートを強化する。

---

最終更新日: 2025-12-19