# VS Code Dev Container 運用終了について

## 運用終了日

2026-01-21

## 運用終了の理由

本プロジェクトでは、当初DevContainer環境での開発を推奨していましたが、以下の理由により運用を終了しました：

- **ファイル操作のpermissions問題**: DevContainer内でファイル操作の権限エラーが頻発
- **プラットフォーム固有バイナリの不一致**: esbuild等のバイナリがホストOSとコンテナで競合
- **環境の不安定性**: postCreateCommandの実行失敗やnode_modulesマウント問題

## 現在の推奨環境

**ローカル環境（macOS / Linux）での直接開発**

### セットアップ手順

1. **依存関係インストール**
   ```bash
   pnpm install
   ```

2. **環境変数設定**
   ```bash
   cp .env.example .env
   # .env を編集してAPI キー等を設定
   ```

3. **開発サーバー起動**
   ```bash
   pnpm run dev
   ```

詳細は [README.md](../../README.md) を参照してください。

---

## 過去のDevContainer設定（参考）

DevContainer設定は `.devcontainer/devcontainer.json` に残されていますが、すべてコメントアウトされています。

参考として、以下の機能が提供されていました：

- **ベースイメージ**: Node.js 22 LTS (Bookworm)
- **VS Code拡張機能**: ESLint, Prettier, Tailwind CSS等
- **ポート転送**: 3000番（Next.js開発サーバー）
- **自動セットアップ**: postCreateCommand による依存関係インストール

---

最終更新日: 2026-01-21
