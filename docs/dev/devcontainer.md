# VS Code Dev Container 設定と使い方

本プロジェクトでは、VS Code Dev Containerを使用して統一された開発環境を提供しています。

## 概要

### Dev Containerとは

Dev Containerは、Docker コンテナを開発環境として利用する仕組みです。以下のメリットがあります:

- **環境の統一**: チームメンバー全員が同じ開発環境で作業
- **セットアップの簡素化**: 複雑な環境構築が不要
- **依存関係の隔離**: ホストマシンを汚さず、クリーンな環境を維持
- **再現性**: いつでも同じ環境を再構築可能

### 本プロジェクトの構成

- **ベースイメージ**: `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`
  - Node.js 22 LTS
  - TypeScript 5.x
  - Git, curl, wget 等の開発ツール
- **ポート**: 3000番（Next.js開発サーバー）を自動転送
- **VS Code拡張機能**: ESLint, Prettier, Tailwind CSS IntelliSense等を自動インストール
- **Git認証**: ホストのSSH/GPG設定を継承

## セットアップ

### 前提条件

1. **Docker Desktop** がインストールされていること
   - macOS: [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
   - Windows: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Linux: Docker Engine + Docker Compose

2. **VS Code** と **Dev Containers 拡張機能**
   - VS Code: [Visual Studio Code](https://code.visualstudio.com/)
   - 拡張機能: `ms-vscode-remote.remote-containers`

### 初回起動手順

1. **プロジェクトを開く**
   ```bash
   cd /path/to/kozokaai-mailmagazine-sender
   code .
   ```

2. **Dev Containerで再起動**
   - VS Codeが自動的に検出: 「Reopen in Container」通知が表示される場合はクリック
   - または、Command Palette（`Cmd+Shift+P` / `Ctrl+Shift+P`）→ **「Dev Containers: Reopen in Container」** を実行

3. **コンテナビルド完了を待つ**
   - 初回は5〜10分程度（イメージダウンロード + `pnpm install`）
   - ターミナルに `Done. Press any key to close the terminal.` が表示されたら完了

4. **環境変数ファイル作成**
   ```bash
   cp .env.example .env
   # .env を編集してAPI キー等を設定
   ```

5. **開発サーバー起動**
   ```bash
   pnpm run dev
   ```
   - ブラウザで http://localhost:3000 を開く

### 2回目以降の起動

既にコンテナイメージがビルド済みの場合、起動は1〜2分程度で完了します。

```bash
code .
# Command Palette → "Dev Containers: Reopen in Container"
```

## 動作確認

### Node.js / npm バージョン確認

```bash
node --version
# v22.17.0 (または v22.x.x)

npm --version
# 10.9.0 (または 10.x.x)
```

### ESLint / TypeScript 確認

```bash
pnpm run lint
# ✔ No ESLint warnings or errors

pnpm run type-check
# tsc --noEmit (エラーなし)

pnpm run build
# ✓ Compiled successfully
```

### Git操作確認

```bash
git config --global user.name
git config --global user.email

# SSH接続確認（GitHub）
ssh -T git@github.com
# Hi username! You've successfully authenticated...
```

## トラブルシューティング

### 1. ポート競合エラー

**問題:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**原因:** ホストで既に3000番ポートが使用されている

**対応:**
```bash
# 使用中プロセスを確認
lsof -i :3000

# プロセスを停止、または別ポートで起動
PORT=3001 pnpm run dev
```

### 2. Git 認証エラー

**問題:**
```
Permission denied (publickey).
```

**原因:** SSH キーがコンテナにマウントされていない

**対応:**
```bash
# ホストの~/.ssh ディレクトリを確認
ls -la ~/.ssh

# id_rsa または id_ed25519 が存在するか確認
# 存在しない場合は新規作成
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 3. .env ファイルが反映されない

**問題:** 環境変数が読み込まれない

**原因:** `.env` ファイルが作成されていない

**対応:**
```bash
# .env.example をコピー
cp .env.example .env

# 編集
code .env
```

### 4. package.json 更新後に依存関係エラー

**問題:** 新しいパッケージが見つからない

**原因:** `postCreateCommand` は初回のみ実行される

**対応:**
```bash
# 手動で pnpm install
pnpm install

# または、コンテナをリビルド
# Command Palette → "Dev Containers: Rebuild Container"
```

### 5. macOS でのファイルI/Oが遅い

**問題:** ファイル保存やHMRが遅い

**原因:** Docker Desktop for Mac のファイルシステムパフォーマンス

**対策:**
- 現在の設定で `consistency=cached` を使用（既に最適化済み）
- それでも遅い場合は、Named Volumeを検討（advanced）

### 6. コンテナが起動しない

**問題:** コンテナビルドでエラーが発生

**対応:**
```bash
# Docker Desktop を再起動
# Docker Desktop > Preferences > Reset > Restart Docker Desktop

# VS Code Dev Container ログを確認
# Command Palette → "Dev Containers: Show Container Log"

# キャッシュをクリアしてリビルド
# Command Palette → "Dev Containers: Rebuild Container Without Cache"
```

## カスタマイズガイド

### VS Code拡張機能の追加

`.devcontainer/devcontainer.json` の `extensions` 配列に追加:

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        // 追加したい拡張機能のIDを記述
        "example.extension-id"
      ]
    }
  }
}
```

### Node.js バージョンの変更

イメージタグを変更:

```json
{
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm"
  // 20 = Node.js 20 LTS
}
```

### ポート転送の追加

複数のポートを転送する場合:

```json
{
  "forwardPorts": [3000, 3001, 5000],
  "portsAttributes": {
    "3000": { "label": "Next.js" },
    "3001": { "label": "API Server" },
    "5000": { "label": "Storybook" }
  }
}
```

### データベース（PostgreSQL）の追加

`docker-compose.yml` を使用する構成に変更:

1. `.devcontainer/docker-compose.yml` 作成
2. `.devcontainer/devcontainer.json` を更新

詳細は [Dev Containers 公式ドキュメント](https://containers.dev/guide/dockerfile) を参照。

## コマンドリファレンス

### Dev Containerコマンド

| コマンド | 説明 |
|---------|------|
| Reopen in Container | コンテナで開く |
| Reopen Folder Locally | ローカルに戻る |
| Rebuild Container | コンテナを再ビルド |
| Rebuild Without Cache | キャッシュなしで再ビルド |
| Show Container Log | コンテナログ表示 |

### npm scripts

| コマンド | 説明 |
|---------|------|
| `pnpm run dev` | 開発サーバー起動 |
| `pnpm run build` | Next.jsビルド |
| `pnpm run lint` | ESLint実行 |
| `pnpm run type-check` | TypeScript型チェック |
| `pnpm run commit` | メールアーカイブ作成（カスタムCLI） |

## 参考リンク

- [VS Code Dev Containers 公式ドキュメント](https://code.visualstudio.com/docs/devcontainers/containers)
- [devcontainer.json リファレンス](https://containers.dev/implementors/json_reference/)
- [Microsoft Dev Container Images](https://github.com/devcontainers/images)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

最終更新日: 2025-12-18
