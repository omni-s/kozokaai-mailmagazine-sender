# 初めてのメール作成ガイド

このガイドは、**技術的な知識がないマーケティング担当者の方**が、Cursor IDE を使って安全かつ効率的にメールマガジンを作成できるよう、ステップバイステップで解説します。

---

## はじめに

### このガイドの目的

- Cursor IDE でメールマガジンを作成する基本的な流れを理解する
- 画像やボタンを追加して、プロフェッショナルなメールを作成する
- エラーを避けながら、安全にメールを配信する

### 必要なツール

1. **Cursor IDE** - メール作成用のエディタ
2. **pnpm** - コマンド実行ツール（既にインストール済み）
3. **ブラウザ** - メールのプレビュー確認用（Chrome、Edge、Safari など）

### 安心してください

このガイドに従えば、技術的な知識がなくても大丈夫です。Cursor AI があなたをサポートします。

---

## STEP 1: 環境セットアップ

### 1-1. Cursor IDE を起動

1. Cursor IDE を起動
2. プロジェクトフォルダを開く（`kozokaai-mailmagazine-sender`）

### 1-2. 開発サーバーを起動

**ターミナルで以下のコマンドを実行:**

```bash
pnpm run dev
```

**実行結果:**
```
> kozokaai-mailmagazine-sender@1.0.0 dev
> next dev --turbopack

  ▲ Next.js 16.1.0
  - Local:        http://localhost:3000

✓ Starting...
✓ Ready in 2.3s
```

### 1-3. ブラウザでプレビューを確認

1. ブラウザを開く
2. `http://localhost:3000` にアクセス
3. メールのプレビューが表示されれば成功

**表示例:**
```
kozokaAI マーケティングチーム

こんにちは、

kozokaAI BOOSTマガジンへようこそ...
```

---

## STEP 2: 最初のメール作成（Hello World）

### 2-1. page.tsx を開く

**ファイルパス:**
```
src/app/page.tsx
```

**Cursor IDE で開く方法:**
1. 左側のファイルツリーから `src` → `app` → `page.tsx` をクリック
2. ファイルが開かれます

### 2-2. MailContent() 関数を探す

**page.tsx の中にある `MailContent()` 関数:**

```typescript
function MailContent() {
  return (
    <EmailWrapper previewText="kozokaAI BOOSTマガジン - 最新のAI活用事例をお届けします">
      {/* ここがメールの本文です */}
    </EmailWrapper>
  );
}
```

### 2-3. メールコンテンツを編集

**例: シンプルな挨拶メール**

```typescript
function MailContent() {
  return (
    <EmailWrapper previewText="こんにちは、kozokaAI からのご挨拶です">
      <EmailSection>
        <EmailHeading>こんにちは</EmailHeading>
        <EmailText>
          kozokaAI マーケティングチームです。
          いつもご愛読いただき、ありがとうございます。
        </EmailText>
      </EmailSection>
    </EmailWrapper>
  );
}
```

### 2-4. ブラウザでプレビューを確認

1. ブラウザで `http://localhost:3000` を開く
2. 編集した内容が即座に反映されます（Hot Reload）

**表示例:**
```
こんにちは

kozokaAI マーケティングチームです。
いつもご愛読いただき、ありがとうございます。
```

---

## コラム: MailContentBody パターン（重要）

### MailContentBody とは？

メールのコンテンツは、**MailContentBody()** 関数にまとめられています。この関数を編集すると、**ブラウザプレビューと配信メールの両方に自動的に反映**されます。

### なぜ MailContentBody を使うのか？

以前の実装では、同じコンテンツを 2 回記述する必要がありました：

```tsx
// 悪い例（古い実装）
export function MailContent() {
  return (
    <EmailWrapper>
      <EmailSection>...</EmailSection> ← 1回目
    </EmailWrapper>
  );
}

export default function Home() {
  return (
    <EmailWrapper>
      <EmailSection>...</EmailSection> ← 2回目（重複）
    </EmailWrapper>
  );
}
```

新しい実装では、**MailContentBody()** を共通化することで、1 回だけ記述すれば良くなりました：

```tsx
// 良い例（新しい実装）
function MailContentBody() {
  return (
    <>
      <EmailHeader />
      <EmailSection>...</EmailSection> ← 1回だけ
    </>
  );
}

export function MailContent() {
  return <EmailWrapper><MailContentBody /></EmailWrapper>;
}

export default function Home() {
  return <EmailWrapper preview><MailContentBody /></EmailWrapper>;
}
```

### メリット

- **保守性**: 1 箇所編集すれば、両方に反映される
- **不整合防止**: ブラウザプレビューと配信メールで異なる内容になるリスクがない
- **コード削減**: 約 37% のコード削減

### 注意事項

⚠️ **重要**: MailContentBody() を編集すると、ブラウザプレビューと配信メールの両方に影響します。編集後は、必ずブラウザプレビューで確認してください。

### 実装例

**src/app/page.tsx:**

```tsx
/**
 * MailContentBody - メールコンテンツ本体
 */
function MailContentBody() {
  return (
    <>
      {/* ヘッダー画像（統一管理） */}
      <EmailHeader />

      {/* タイトルセクション */}
      <EmailSection>
        <EmailHeading level={1}>サンプルメールマガジン</EmailHeading>
        <EmailText variant="muted">
          このテンプレートを編集して、あなたのメールマガジンをデザインしてください。
        </EmailText>
      </EmailSection>

      {/* コンテンツカード */}
      <EmailSection>
        <EmailCard>
          <EmailText margin="0 0 16px 0">
            ここにコンテンツを追加できます。
          </EmailText>
        </EmailCard>
      </EmailSection>

      {/* CTA ボタン */}
      <EmailSection>
        <div style={{ textAlign: 'center' }}>
          <EmailButton href="https://example.com">詳細を見る</EmailButton>
        </div>
      </EmailSection>
    </>
  );
}

/**
 * メール配信用コンポーネント（Hooksなし）
 */
export function MailContent() {
  return (
    <EmailWrapper
      preview={false}
      previewText="サンプルメールマガジンのプレビューテキストです"
    >
      <MailContentBody />
    </EmailWrapper>
  );
}

/**
 * ホーム画面（プレビュー + 配信準備UI）
 */
export default function Home() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      {/* メールプレビュー */}
      <EmailWrapper
        preview={true}
        previewText="サンプルメールマガジンのプレビューテキストです"
      >
        <MailContentBody />
      </EmailWrapper>

      {/* 配信準備ボタン */}
      <Container size="sm" mt="xl" mb="xl">
        <Box style={{ textAlign: 'center' }}>
          <Button onClick={open} size="lg" color="blue" fullWidth>
            配信準備を開始
          </Button>
        </Box>
      </Container>

      {/* 配信準備Modal */}
      <Modal opened={opened} onClose={close} title="配信準備" size="lg" centered>
        <CommitForm onSuccess={close} />
      </Modal>
    </>
  );
}
```

### どこを編集すればいいか

**MailContentBody() 関数のみを編集してください。**

- **MailContent()** は編集しない（自動配信用の内部設定）
- **Home()** は編集しない（プレビュー表示用の内部設定）
- **MailContentBody()** のみ編集する（メールの内容を変更）

---

## STEP 3: 画像を追加する

### 3-1. 画像を準備

**画像サイズ:**
- ヘッダー画像: 560×293px
- フッター画像: 200×105px

**ファイル形式:**
- PNG または JPG

### 3-2. 画像を配置

**配置場所:**
```
public/MAIL-ASSETS/
```

**配置方法:**
1. Finder（Mac）または Explorer（Windows）で画像ファイルをコピー
2. `public/MAIL-ASSETS/` フォルダにペースト

**配置例:**
```
public/MAIL-ASSETS/
├── hero.png         # ヘッダー画像（560×293px）
└── footer.png       # フッター画像（200×105px）
```

### 3-3. メールに画像を追加

**例: ヘッダー画像を追加**

```typescript
function MailContent() {
  return (
    <EmailWrapper previewText="こんにちは、kozokaAI からのご挨拶です">
      <EmailSection>
        {/* ヘッダー画像 */}
        <Img
          src="/MAIL-ASSETS/hero.png"
          alt="kozokaAI ヘッダー"
          width={560}
          height={293}
        />

        <EmailHeading>こんにちは</EmailHeading>
        <EmailText>
          kozokaAI マーケティングチームです。
          いつもご愛読いただき、ありがとうございます。
        </EmailText>
      </EmailSection>
    </EmailWrapper>
  );
}
```

### 3-4. ブラウザでプレビューを確認

1. ブラウザで `http://localhost:3000` を開く
2. ヘッダー画像が表示されていれば成功

---

## STEP 4: ボタンを追加する

### 4-1. ボタンコンポーネントを使う

**例: 「詳しく見る」ボタンを追加**

```typescript
function MailContent() {
  return (
    <EmailWrapper previewText="こんにちは、kozokaAI からのご挨拶です">
      <EmailSection>
        <Img
          src="/MAIL-ASSETS/hero.png"
          alt="kozokaAI ヘッダー"
          width={560}
          height={293}
        />

        <EmailHeading>こんにちは</EmailHeading>
        <EmailText>
          kozokaAI マーケティングチームです。
          いつもご愛読いただき、ありがとうございます。
        </EmailText>

        {/* ボタン */}
        <EmailButton href="https://www.kozoka-ai.co.jp" backgroundColor="#00ADAA">
          詳しく見る
        </EmailButton>
      </EmailSection>
    </EmailWrapper>
  );
}
```

### 4-2. ブラウザでプレビューを確認

1. ブラウザで `http://localhost:3000` を開く
2. 「詳しく見る」ボタンが表示されていれば成功

**ボタンの色:**
- 背景色: kozokaAI ブランドカラー（#00ADAA）
- ホバー時: #009A97

---

## STEP 5: 配信準備

### 5-1. メールの最終確認

**チェックリスト:**
- [ ] プレビューテキストが設定されている
- [ ] 見出し、本文、ボタンが正しく表示されている
- [ ] 画像が正しく表示されている
- [ ] リンク URL が正しい
- [ ] 「です・ます」調で記述されている

### 5-2. pnpm run commit を実行

**ターミナルで以下のコマンドを実行:**

```bash
pnpm run commit
```

### 5-3. 対話型入力

**以下の項目を入力:**

**1. コミットメッセージ（英数字のみ）:**
```
例: summer-sale
```

**2. メール件名（日本語OK）:**
```
例: 【サマーセール】最大50%OFFのお知らせ
```

**3. Resend Segment ID:**
```
例: 78261eea-8f8b-4381-83c6-79fa7120f1cf
```

**4. 配信タイミング:**
```
即時配信 or 予約配信
```

**5. 配信日時（予約配信の場合）:**
```
例: 2026-01-20 18:00
```

### 5-4. 自動処理

**スクリプトが自動的に:**
1. アーカイブディレクトリを作成（`public/archives/{YYYY}/{MM}/{DD-MSG}/`）
2. `src/app/page.tsx` → `mail.tsx` に移動
3. `public/MAIL-ASSETS/` → `assets/` に画像移動
4. `config.json` 生成（subject, segmentId, scheduledAt, sentAt: null）
5. `src/app/page.tsx` を初期テンプレートにリセット
6. Git commit & push

**実行結果:**
```
✓ アーカイブディレクトリを作成しました: public/archives/2026/01/20-summer-sale
✓ mail.tsx を作成しました
✓ 画像を移動しました
✓ config.json を生成しました
✓ src/app/page.tsx をリセットしました
✓ Git commit & push しました

次のステップ: GitHub で Pull Request を作成してください
```

---

## STEP 6: レビューと本番配信

### 6-1. Pull Request を作成

**GitHub で Pull Request を作成:**
1. GitHub にアクセス
2. リポジトリを開く
3. 「Compare & pull request」ボタンをクリック
4. タイトル: `MAIL: summer-sale`
5. 「Create pull request」ボタンをクリック

### 6-2. GitHub Actions の自動チェック

**以下のチェックが自動的に実行されます:**
1. **Check Workflow**: Lint、型チェック、ビルド、バリデーション
2. **Staging Workflow**: S3 アップロード、テストメール送信

### 6-3. テストメールを確認

**テストメールが届きます（REVIEWER_EMAIL に設定されたアドレス）:**
- 件名: `[TEST] 【サマーセール】最大50%OFFのお知らせ`
- 内容: 作成したメール（画像は S3 URL に自動的に置換されます）

**確認項目:**
- [ ] 件名が正しい
- [ ] 本文が正しく表示されている
- [ ] 画像が正しく表示されている
- [ ] ボタンのリンクが正しい
- [ ] 配信停止リンクが含まれている

### 6-4. レビュー・承認

**レビュアー（上司またはエンジニア）に確認を依頼:**
1. Pull Request のリンクを共有
2. レビュアーが確認
3. 承認後、「Merge pull request」ボタンをクリック

### 6-5. 本番配信（Manual Approval）

**本番配信 Workflow が起動:**
1. **Manual Approval 待機** - 承認者が承認ボタンを押すまで待機
2. **承認ボタン押下** - GitHub Actions の Environments から「Review deployments」→「Approve and deploy」
3. **配信実行**
   - 即時配信の場合: 即座に配信
   - 予約配信の場合: 指定日時まで待機（Scheduled Email Delivery Workflow が 5 分ごとに確認）
4. **配信完了** - `config.json` の `sentAt` が自動更新

---

## チェックリスト

### 作成前チェックリスト

- [ ] Cursor IDE が起動している
- [ ] pnpm run dev でサーバーが起動している
- [ ] ブラウザで http://localhost:3000 が開ける

### 作成中チェックリスト

- [ ] プレビューテキストが設定されている
- [ ] 見出し、本文、ボタンが正しく表示されている
- [ ] 画像が正しく表示されている（ヘッダー: 560×293px、フッター: 200×105px）
- [ ] ブランドカラー（#00ADAA）が使用されている
- [ ] 「です・ます」調で記述されている
- [ ] Tailwind CSS クラスではなく、インラインスタイルを使用している

### 配信前チェックリスト

- [ ] テストメールを確認した
- [ ] 件名が正しい
- [ ] 本文が正しく表示されている
- [ ] 画像が正しく表示されている
- [ ] ボタンのリンクが正しい
- [ ] 配信停止リンクが含まれている
- [ ] レビュアーの承認を得た

---

## よくある質問

### Q1: メールが表示されない

**A:** ブラウザのコンソールを確認してください（F12 → Console タブ）。構文エラー（閉じタグ忘れなど）が原因の可能性があります。

詳細: `docs/for-non-engineers/common-errors.md`

### Q2: 画像が表示されない

**A:** 画像ファイルが `public/MAIL-ASSETS/` に配置されているか確認してください。ファイル名のタイポも確認してください。

詳細: `docs/for-non-engineers/common-errors.md`

### Q3: Tailwind CSS クラスが効かない

**A:** メールクライアントは Tailwind CSS に対応していません。インラインスタイルを使用してください。Cursor AI が自動的に変換します。

詳細: `.cursor/rules/non-engineer-safety.mdc`

### Q4: pnpm run commit でエラーが出る

**A:** `src/app/page.tsx` が存在しない可能性があります。`src/app/template.tsx` から復元してください。

詳細: `docs/for-non-engineers/common-errors.md`

---

## 次のステップ

### もっとコンポーネントを使いたい

- **コンポーネントリファレンス**: `docs/for-non-engineers/component-reference.md`

### エラーが発生した

- **よくあるエラー集**: `docs/for-non-engineers/common-errors.md`

### ブランドガイドを確認したい

- **kozokaAI ブランドガイド**: `docs/for-non-engineers/brand-guide.md`

---

**最終更新日**: 2026-01-21
