# セキュリティアップデート手順

## 概要

本ドキュメントは、プロジェクトの依存関係における脆弱性への対応手順を定義します。セキュリティアップデートは最優先で実施し、迅速かつ確実な対応を心がけます。

## 依存関係の脆弱性対応フロー

### 1. 脆弱性検出

脆弱性情報の主な入手先：

- **GitHub Dependabot Alerts**: リポジトリの Security タブで自動検出
- **npm audit**: `npm audit` コマンドで手動確認
- **公式セキュリティ情報**: Vercel Bulletin、Next.js Security、React Security 等
- **セキュリティニュース**: CVE データベース、GitHub Security Advisories

### 2. 影響範囲確認

#### 2.1. 実際にインストールされたバージョンの確認

package.json の semver（`^`, `~`）により、宣言されたバージョンと実際にインストールされたバージョンが異なる場合があります。

```bash
# 特定パッケージのバージョン確認
npm list <package-name>

# 例: Next.js のバージョン確認
npm list next

# 出力例:
# kozokaai-mailmagazine-sender@0.1.0
# └── next@15.5.9
```

#### 2.2. 脆弱性の深刻度評価

- **Critical**: 即座に対応必須（RCE、認証バイパス等）
- **High**: 24時間以内に対応
- **Medium**: 1週間以内に対応
- **Low**: 次回定期メンテナンス時に対応

### 3. 更新実施

#### 3.1. 公式の自動修正ツールを最優先で使用

多くのフレームワークやライブラリは、脆弱性修正のための自動ツールを提供しています。

**例: React2Shell（CVE-2025-55182）の場合**

```bash
# Vercel 公式の自動修正ツール
npx fix-react2shell-next
```

#### 3.2. 手動での依存関係更新

自動ツールがない場合、または追加対応が必要な場合：

```bash
# 1. package.json の該当パッケージバージョンを更新
# 例: "next": "^15.1.3" → "next": "^15.5.9"

# 2. pnpm install 実行
pnpm install

# 3. 実際のバージョン確認
npm list next react react-dom
```

### 4. 破壊的変更への対応

依存関係の更新により、API 仕様変更や破壊的変更が発生する場合があります。

#### 4.1. ビルドエラーの確認

```bash
pnpm run build
```

#### 4.2. 型エラーの修正（TypeScript）

```bash
pnpm run type-check
```

#### 4.3. Lint エラーの確認

```bash
pnpm run lint
```

#### 4.4. 頻出する破壊的変更パターン

**Tailwind CSS メジャーバージョン更新**
- Tailwind CSS 4.x: PostCSS プラグインが別パッケージ化
  ```bash
  pnpm install -D @tailwindcss/postcss
  ```
  ```javascript
  // postcss.config.js
  module.exports = {
    plugins: {
      '@tailwindcss/postcss': {},  // 旧: tailwindcss: {}
      autoprefixer: {},
    },
  };
  ```

**@react-email/render API 変更**
- render() 関数が Promise を返すように変更
  ```typescript
  // 修正前
  const html = render(Component(), { plainText: false });

  // 修正後
  const html = await render(Component(), { plainText: false });
  ```

**Resend SDK broadcasts API 変更**
- broadcasts.send() がオブジェクトではなく broadcast ID を要求
  ```typescript
  // 修正前（エラー）
  const { data, error } = await resend.broadcasts.send({
    audience_id: audienceId,
    from: fromEmail,
    subject: subject,
    html,
  });

  // 修正後（2ステップ）
  // Step 1: Broadcast を作成
  const { data: createData, error: createError } = await resend.broadcasts.create({
    name: `Broadcast - ${subject}`,
    audienceId: audienceId,
    from: fromEmail,
    subject: subject,
    html,
  });

  // Step 2: Broadcast を送信
  const { data: sendData, error: sendError } = await resend.broadcasts.send(createData.id);
  ```

### 5. 検証

#### 5.1. ビルド成功確認

```bash
pnpm run build
```

出力例（成功時）:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

#### 5.2. 型チェック通過確認

```bash
pnpm run type-check
```

#### 5.3. Lint 通過確認

```bash
pnpm run lint
```

#### 5.4. ローカル開発サーバー起動確認

```bash
pnpm run dev
```

http://localhost:3000 にアクセスして、アプリケーションが正常に動作することを確認。

### 6. Git コミット

セキュリティアップデートは `FIX:` プレフィックスを使用します。

```bash
git add .
git commit -m "FIX: <脆弱性名>対応（CVE-YYYY-XXXXX）

- <パッケージ名> <旧バージョン> → <新バージョン>に更新
- <破壊的変更への対応内容>
- <その他の修正内容>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push
```

**コミットメッセージ例**:
```
FIX: React2Shell脆弱性対応（CVE-2025-55182）

- Next.js 15.1.3 → 15.5.9に更新
- React/React-DOM 19.0.0 → 19.2.3に更新
- Tailwind CSS 4.x PostCSS移行（@tailwindcss/postcss導入）
- @react-email/render API変更対応（render()にawait追加）
- Resend broadcasts API仕様変更対応（create + sendの2ステップに変更）
- Button asChildプロパティ削除（型エラー修正）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## 頻出パターン集

### React/Next.js 更新時の注意点

| 問題 | 原因 | 対処法 |
|------|------|--------|
| @react-email/render 型エラー | Promise 化 | `await render()` に修正 |
| Tailwind CSS ビルドエラー | PostCSS プラグイン分離 | `@tailwindcss/postcss` インストール |
| UI コンポーネント `asChild` エラー | Radix UI Slot 未インストール | `@radix-ui/react-slot` インストール、または `asChild` を削除 |

### Resend SDK 更新時の注意点

| 問題 | 原因 | 対処法 |
|------|------|--------|
| broadcasts.send() 型エラー | API 仕様変更 | create() → send() の2ステップに変更 |
| audiences API エラー | エンドポイント変更 | 公式ドキュメント（Context7）で最新仕様確認 |

## 参考リソース

### 公式セキュリティ情報

- **Vercel Security Bulletins**: https://vercel.com/kb/bulletin
- **Next.js Security**: https://nextjs.org/docs/app/building-your-application/deploying/security
- **React Security**: https://react.dev/blog

### ドキュメント検索ツール

- **Context7 MCP**: Resend、Next.js 等の最新ドキュメントを検索
  - 使用例: `/resend/resend-node` の `broadcasts send` トピック

### npm コマンド

```bash
# 脆弱性スキャン
npm audit

# 自動修正（注意: 破壊的変更の可能性あり）
npm audit fix

# 強制修正（非推奨: 依存関係が壊れる可能性大）
npm audit fix --force

# 特定パッケージの更新
npm update <package-name>

# 特定パッケージの最新版確認
npm outdated <package-name>
```

## トラブルシューティング

### ビルドエラーが解消されない場合

1. `node_modules` と `package-lock.json` を削除して再インストール
   ```bash
   rm -rf node_modules package-lock.json
   pnpm install
   ```

2. Next.js のキャッシュをクリア
   ```bash
   rm -rf .next
   pnpm run build
   ```

### 型エラーが解消されない場合

1. TypeScript バージョンの確認
   ```bash
   npm list typescript
   ```

2. `@types/*` パッケージの更新
   ```bash
   npm update @types/react @types/react-dom @types/node
   ```

### 依存関係の競合が発生した場合

1. `npm list <package-name>` で依存ツリー確認
2. 競合するパッケージのバージョンを調整
3. 必要に応じて `package.json` の `overrides` や `resolutions` を使用

## 履歴

### 2025-12-19: React2Shell 脆弱性対応（CVE-2025-55182）

- **脆弱性**: Next.js 15.0.0-16.0.6、React 19 でリモートコード実行
- **対応**:
  - Next.js 15.1.3 → 15.5.9
  - React/React-DOM 19.0.0 → 19.2.3
  - Tailwind CSS 4.x PostCSS 移行
  - @react-email/render Promise 対応
  - Resend broadcasts API 2ステップ化
- **コミット**: b68945f

### 2025-12-22: CVE-2025-55182 最新版アップグレード（保守的）

- **方針**: Next.js/React は現状維持（既にCVE対応済み）、関連パッケージのみ最新化
- **対応**:
  - @react-email/render 1.0.1 → 2.0.0（React Email 2.0安定版）
  - Resend SDK 4.0.1 → 6.6.0（最新のバグ修正とAPI改善）
  - TypeScript 5.7.2 → 5.9.3（package.json修正、実インストール版と整合）
  - Next.js 15.5.9、React 19.2.3: 維持（Vercel推奨バージョンを満たす）
- **破壊的変更**: なし（既存コードは互換性あり）
- **検証**: ビルド、型チェック、Lint すべて成功
- **参考**: Vercel Security Bulletin - https://vercel.com/changelog/cve-2025-55182

### 2025-12-22: Next.js 16.1.0 メジャーアップグレード

- **方針**: Turbopack安定版、長期サポート、将来の破壊的変更に備える
- **対応**:
  - Next.js 15.5.9 → 16.1.0（Turbopack デフォルト化）
  - eslint-config-next 15.5.9 → 16.1.0
  - tsconfig.json 自動更新（jsx: react-jsx、include: .next/dev/types/**/*.ts）
- **破壊的変更の影響**: 本プロジェクトは影響なし
  - Async Request APIs: 使用していない
  - middleware.ts: 存在しない
  - カスタムwebpack設定: なし
  - images.domains: 使用していない
- **検証**: ビルド成功（Turbopack 1218.2ms、11 workers並列処理）
- **トラブルシューティング**: 初回ビルドエラー → `.next` 削除でクリーンビルド成功
- **参考**: Next.js 16 Upgrade Guide - https://nextjs.org/docs/app/guides/upgrading/version-16

### 2025-12-29: React2Shell 最新パッチ検証（CVE-2025-66478）

- **脆弱性**: CVE-2025-66478（Critical CVSS 10.0）、CVE-2025-55184/55183/67779
  - リモートコード実行（RCE）via crafted RSC payload
  - DoS via malicious HTTP request causing server hang
  - Compiled Server Action source code exposure
  - Incomplete DoS fix (infinite loop)
- **検証ツール**: `npx fix-react2shell-next`（Vercel公式）
- **検証結果**: ✅ **安全確認済み**
  - Next.js 16.1.0 は全4件のCVEに対して脆弱性なし
  - 2025年12月11日のセキュリティパッチ適用済みバージョン
- **検証項目**:
  - TypeScript型チェック: 成功
  - ESLint: 成功
  - Next.jsビルド: 成功（Turbopack 1351.8ms、11 workers並列処理）
- **対応**: バージョン更新不要（現行バージョンで問題なし）
- **参考**:
  - Next.js Security Update (2025-12-11) - https://nextjs.org/blog/security-update-2025-12-11
  - React2Shell Security Bulletin - https://vercel.com/kb/bulletin/react2shell

---

最終更新日: 2025-12-29
