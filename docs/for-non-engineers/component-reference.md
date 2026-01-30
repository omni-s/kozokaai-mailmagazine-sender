# コンポーネントリファレンス

このガイドは、メールデザインで使える**コンポーネント（部品）**を視覚的に説明します。各コンポーネントは、コピー&ペーストで使える実装例付きです。

---

## 目次

1. [EmailWrapper](#emailwrapper) - メール全体のレイアウト
2. [EmailHeader](#emailheader) - ヘッダー画像（ブランドロゴ）
3. [EmailSection](#emailsection) - セクション（段落のまとまり）
4. [EmailCard](#emailcard) - カード（枠付きコンテンツ）
5. [EmailHeading](#emailheading) - 見出し
6. [EmailText](#emailtext) - 本文テキスト
7. [EmailButton](#emailbutton) - ボタン（リンク）
8. [Img](#img) - 画像
9. [EmailDivider](#emaildivider) - 区切り線
10. [完全な実装例](#完全な実装例) - kozokaAI BOOST マガジン

---

## EmailWrapper

### 用途

メール全体を包むコンポーネント。すべてのメールは、このコンポーネントで囲む必要があります。

### 必須プロパティ

| プロパティ | 説明 | 例 |
|-----------|------|-----|
| `previewText` | メールのプレビューテキスト（50〜80文字） | `"サマーセール最大50%OFF！この機会をお見逃しなく。"` |

### デフォルト値

- 外側テーブル: 100%幅、背景色 `#f6f9fc`
- 内側テーブル: 600px固定幅、背景色 `#ffffff`
- 中央揃え: `align="center"`

### 実装例

```typescript
<EmailWrapper previewText="サマーセール最大50%OFF！この機会をお見逃しなく。">
  {/* ここにメールの本文を記述 */}
</EmailWrapper>
```

### 注意事項

- **EmailFooter は自動的に追加されます** - 手動で追加する必要はありません
- **preview プロパティは使わない** - ブラウザプレビュー用の内部設定です

---

## EmailHeader

### 概要

kozokaAI ブランドヘッダーを表示するコンポーネントです。すべてのメールマガジンで共通のヘッダー画像を表示します。

### 用途

- メールの先頭に kozokaAI ロゴを表示
- ブランドの統一性を保つ

### 必須プロパティ

なし（Props なし、誤削除防止のため固定実装）

### デフォルト値

- **画像パス**: `/MAIL-ASSETS/header.png`
- **画像サイズ**: 600×200px
- **代替テキスト**: `kozokaAI`

### 実装例

```tsx
<EmailWrapper previewText="...">
  <EmailHeader />
  <EmailSection>
    <EmailHeading level={1}>タイトル</EmailHeading>
  </EmailSection>
</EmailWrapper>
```

### 注意事項

⚠️ **重要**: このコンポーネントは削除しないでください。

- ブランドの統一性を保つために必須です
- 画像パスは自動的に S3 URL に置換されます

### よくある質問

**Q1. ヘッダー画像を変更したい場合は？**

A1. `public/MAIL-ASSETS/header.png` を差し替えてください。サイズは 600×200px を推奨します。

**Q2. ヘッダーなしのメールを作成したい場合は？**

A2. `<EmailHeader />` を削除してください。ただし、ブランドの統一性のため、基本的には使用を推奨します。

**Q3. ヘッダー画像のサイズを変更したい場合は？**

A3. `src/components/email/EmailHeader.tsx` の `width` と `height` を変更してください。ただし、メールクライアントの互換性のため、600px 幅を推奨します。

---

## EmailSection

### 用途

メールの段落（セクション）を作成します。見出し、本文、ボタンなどをまとめるのに使います。

### 必須プロパティ

なし（すべてオプション）

### デフォルト値

- 背景色: `#ffffff`（白）
- パディング: 上下 `20px`、左右 `0px`

### オプションプロパティ

| プロパティ | 説明 | デフォルト値 | 例 |
|-----------|------|-------------|-----|
| `backgroundColor` | 背景色 | `#ffffff` | `"#f0f9ff"` |
| `paddingTop` | 上部の余白 | `20px` | `30px` |
| `paddingBottom` | 下部の余白 | `20px` | `30px` |

### 実装例

```typescript
<EmailSection>
  <EmailHeading>サマーセール開催中</EmailHeading>
  <EmailText>
    最大50%OFFのお得なセールを開催しています。
  </EmailText>
</EmailSection>
```

### 背景色を変更する例

```typescript
<EmailSection backgroundColor="#f0f9ff" paddingTop="30px" paddingBottom="30px">
  <EmailHeading>お知らせ</EmailHeading>
  <EmailText>
    新製品のリリース情報をお届けします。
  </EmailText>
</EmailSection>
```

### 注意事項

- **複数のセクションを重ねる** - セクションは縦に並べることができます
- **背景色は薄い色を推奨** - 本文が読みやすい薄い色を使用してください

---

## EmailCard

### 用途

枠付きのカードコンテンツを作成します。重要な情報を目立たせるのに便利です。

### 必須プロパティ

なし（すべてオプション）

### デフォルト値

- 背景色: `#ffffff`（白）
- 境界線: `1px solid #e2e8f0`（薄いグレー）
- 角丸: `8px`
- パディング: `24px`

### オプションプロパティ

| プロパティ | 説明 | デフォルト値 | 例 |
|-----------|------|-------------|-----|
| `backgroundColor` | 背景色 | `#ffffff` | `"#f0f9ff"` |
| `borderColor` | 境界線の色 | `#e2e8f0` | `"#00ADAA"` |
| `borderRadius` | 角丸のサイズ | `8px` | `12px` |
| `padding` | 内側の余白 | `24px` | `30px` |

### 実装例

```typescript
<EmailCard>
  <EmailHeading>限定オファー</EmailHeading>
  <EmailText>
    今だけ特別価格でご提供しています。
  </EmailText>
  <EmailButton href="https://www.kozoka-ai.co.jp" backgroundColor="#00ADAA">
    詳しく見る
  </EmailButton>
</EmailCard>
```

### 境界線の色を変更する例

```typescript
<EmailCard borderColor="#00ADAA" borderRadius="12px">
  <EmailHeading>重要なお知らせ</EmailHeading>
  <EmailText>
    システムメンテナンスのお知らせです。
  </EmailText>
</EmailCard>
```

### 注意事項

- **カードの入れ子は避ける** - カードの中にカードを入れると、レイアウトが崩れる可能性があります
- **背景色と境界線の色を統一** - ブランドカラー（#00ADAA）を使うと統一感が出ます

---

## EmailHeading

### 用途

見出し（タイトル）を作成します。セクションやカードの先頭に配置します。

### 必須プロパティ

なし（すべてオプション）

### デフォルト値

- フォントサイズ: `18px`
- フォントウェイト: `bold`（太字）
- カラー: `#1e293b`（ダークグレー）
- テキスト配置: `left`（左揃え）
- マージン: 下部 `12px`

### オプションプロパティ

| プロパティ | 説明 | デフォルト値 | 例 |
|-----------|------|-------------|-----|
| `fontSize` | フォントサイズ | `18px` | `20px` |
| `color` | 文字色 | `#1e293b` | `"#00ADAA"` |
| `textAlign` | テキスト配置 | `left` | `"center"` |
| `marginBottom` | 下部の余白 | `12px` | `16px` |

### 実装例

```typescript
<EmailHeading>サマーセール開催中</EmailHeading>
```

### 中央揃えにする例

```typescript
<EmailHeading textAlign="center">お知らせ</EmailHeading>
```

### 色を変更する例

```typescript
<EmailHeading color="#00ADAA" fontSize="20px">
  kozokaAI 新製品リリース
</EmailHeading>
```

### 注意事項

- **1つのセクションに1つの見出し** - 見出しを乱用すると、読みにくくなります
- **文字色はダークグレーを推奨** - ブランドカラー（#00ADAA）は強調したい場合のみ使用

---

## EmailText

### 用途

本文テキストを作成します。段落ごとに使用します。

### 必須プロパティ

なし（すべてオプション）

### デフォルト値

- フォントサイズ: `15px`
- フォントウェイト: `normal`（標準）
- カラー: `#475569`（グレー）
- 行間: `1.6`
- テキスト配置: `left`（左揃え）
- マージン: 下部 `12px`

### オプションプロパティ

| プロパティ | 説明 | デフォルト値 | 例 |
|-----------|------|-------------|-----|
| `fontSize` | フォントサイズ | `15px` | `13px` |
| `color` | 文字色 | `#475569` | `"#64748b"` |
| `textAlign` | テキスト配置 | `left` | `"center"` |
| `marginBottom` | 下部の余白 | `12px` | `16px` |
| `fontWeight` | フォントウェイト | `normal` | `"bold"` |

### 実装例

```typescript
<EmailText>
  kozokaAI マーケティングチームです。
  いつもご愛読いただき、ありがとうございます。
</EmailText>
```

### 小さいテキストにする例（注意書きなど）

```typescript
<EmailText fontSize="13px" color="#64748b">
  ※ このメールは、kozokaAI のサービスをご利用いただいているお客様に配信しています。
</EmailText>
```

### 中央揃えにする例

```typescript
<EmailText textAlign="center">
  詳細は以下のボタンからご確認ください。
</EmailText>
```

### 注意事項

- **1段落に1つのEmailText** - 長い文章は、段落ごとに分けると読みやすくなります
- **フォントサイズは15px推奨** - 小さすぎると読みにくくなります

---

## EmailButton

### 用途

リンク付きのボタンを作成します。CTA（Call to Action: 行動喚起）に使用します。

### 必須プロパティ

| プロパティ | 説明 | 例 |
|-----------|------|-----|
| `href` | リンク先のURL | `"https://www.kozoka-ai.co.jp"` |

### デフォルト値

- 背景色: `#00ADAA`（kozokaAI ブランドカラー）
- ホバー時背景色: `#009A97`
- 文字色: `#ffffff`（白）
- フォントサイズ: `15px`
- フォントウェイト: `bold`（太字）
- パディング: 上下 `12px`、左右 `24px`
- 角丸: `6px`

### オプションプロパティ

| プロパティ | 説明 | デフォルト値 | 例 |
|-----------|------|-------------|-----|
| `backgroundColor` | 背景色 | `#00ADAA` | `"#1e293b"` |
| `textColor` | 文字色 | `#ffffff` | `"#ffffff"` |
| `fontSize` | フォントサイズ | `15px` | `16px` |
| `paddingVertical` | 上下の余白 | `12px` | `14px` |
| `paddingHorizontal` | 左右の余白 | `24px` | `30px` |
| `borderRadius` | 角丸のサイズ | `6px` | `8px` |

### 実装例

```typescript
<EmailButton href="https://www.kozoka-ai.co.jp" backgroundColor="#00ADAA">
  詳しく見る
</EmailButton>
```

### 背景色を変更する例

```typescript
<EmailButton href="https://www.kozoka-ai.co.jp" backgroundColor="#1e293b">
  お問い合わせ
</EmailButton>
```

### サイズを変更する例

```typescript
<EmailButton
  href="https://www.kozoka-ai.co.jp"
  backgroundColor="#00ADAA"
  fontSize="16px"
  paddingVertical="14px"
  paddingHorizontal="30px"
>
  今すぐ登録
</EmailButton>
```

### 注意事項

- **ボタンは1セクションに1つ推奨** - ボタンを乱用すると、どこをクリックすべきか分かりにくくなります
- **ブランドカラー（#00ADAA）を推奨** - 統一感のあるデザインになります
- **ボタンテキストは短く** - 「詳しく見る」「お問い合わせ」など、5〜10文字程度

---

## Img

### 用途

画像を表示します。ヘッダー画像、フッター画像、その他の画像に使用します。

### 必須プロパティ

| プロパティ | 説明 | 例 |
|-----------|------|-----|
| `src` | 画像のパス（開発時は `/MAIL-ASSETS/` を使用） | `"/MAIL-ASSETS/hero.png"` |
| `alt` | 画像の代替テキスト（スクリーンリーダー用） | `"kozokaAI ヘッダー"` |
| `width` | 画像の幅（px） | `560` |
| `height` | 画像の高さ（px） | `293` |

### デフォルト値

- スタイル: `max-width: 100%`（レスポンシブ対応）

### 実装例

```typescript
<Img
  src="/MAIL-ASSETS/hero.png"
  alt="kozokaAI ヘッダー"
  width={560}
  height={293}
/>
```

### フッター画像の例

```typescript
<Img
  src="/MAIL-ASSETS/footer.png"
  alt="kozokaAI フッター"
  width={200}
  height={105}
/>
```

### 注意事項

- **画像サイズを守る** - ヘッダー: 560×293px、フッター: 200×105px
- **alt テキストを必ず設定** - スクリーンリーダーでの読み上げに必要
- **画像パスは `/MAIL-ASSETS/` を使用** - 本番環境では自動的に S3 URL に置換されます
- **`<img>` タグではなく `Img` コンポーネントを使用** - 画像パスの自動解決に必要

---

## EmailDivider

### 用途

区切り線を表示します。セクション間の視覚的な区切りに使用します。

### 必須プロパティ

なし（すべてオプション）

### デフォルト値

- 色: `#e2e8f0`（薄いグレー）
- 高さ: `1px`
- マージン: 上下 `20px`

### オプションプロパティ

| プロパティ | 説明 | デフォルト値 | 例 |
|-----------|------|-------------|-----|
| `color` | 線の色 | `#e2e8f0` | `"#00ADAA"` |
| `height` | 線の高さ | `1px` | `2px` |
| `marginTop` | 上部の余白 | `20px` | `30px` |
| `marginBottom` | 下部の余白 | `20px` | `30px` |

### 実装例

```typescript
<EmailDivider />
```

### 色を変更する例

```typescript
<EmailDivider color="#00ADAA" height="2px" />
```

### 余白を変更する例

```typescript
<EmailDivider marginTop="30px" marginBottom="30px" />
```

### 注意事項

- **セクション間の区切りに使用** - セクション内で使うと、レイアウトが崩れる可能性があります
- **薄いグレー（#e2e8f0）を推奨** - 線が目立ちすぎないようにします

---

## 完全な実装例

### kozokaAI BOOST マガジン

```typescript
function MailContent() {
  return (
    <EmailWrapper previewText="kozokaAI BOOSTマガジン - 最新のAI活用事例をお届けします">
      {/* ヘッダー画像 */}
      <EmailSection>
        <Img
          src="/MAIL-ASSETS/hero.png"
          alt="kozokaAI BOOSTマガジン ヘッダー"
          width={560}
          height={293}
        />
      </EmailSection>

      {/* 挨拶セクション */}
      <EmailSection>
        <EmailHeading>こんにちは、</EmailHeading>
        <EmailText>
          kozokaAI マーケティングチームです。
          いつもご愛読いただき、ありがとうございます。
        </EmailText>
      </EmailSection>

      {/* お知らせセクション */}
      <EmailSection backgroundColor="#f0f9ff" paddingTop="30px" paddingBottom="30px">
        <EmailCard>
          <EmailHeading>新製品リリースのお知らせ</EmailHeading>
          <EmailText>
            FAX受注入力AI の新バージョンをリリースしました。
            精度が大幅に向上し、処理速度も50%高速化しています。
          </EmailText>
          <EmailButton href="https://www.kozoka-ai.co.jp/products/fax-ai" backgroundColor="#00ADAA">
            詳しく見る
          </EmailButton>
        </EmailCard>
      </EmailSection>

      {/* 区切り線 */}
      <EmailDivider />

      {/* 事例紹介セクション */}
      <EmailSection>
        <EmailHeading>お客様の活用事例</EmailHeading>
        <EmailText>
          株式会社○○様では、商談ログAI を導入することで、
          営業担当者の事務作業時間を70%削減することに成功しました。
        </EmailText>
        <EmailButton href="https://www.kozoka-ai.co.jp/case-studies" backgroundColor="#00ADAA">
          事例を見る
        </EmailButton>
      </EmailSection>

      {/* フッター画像 */}
      <EmailSection>
        <Img
          src="/MAIL-ASSETS/footer.png"
          alt="kozokaAI ロゴ"
          width={200}
          height={105}
        />
      </EmailSection>

      {/* フッター署名（EmailFooter は自動的に追加されます） */}
    </EmailWrapper>
  );
}
```

---

## コンポーネントのインポート

**すべてのコンポーネントをインポートする:**

```typescript
import { EmailButton } from '@/components/email/EmailButton';
import { EmailCard } from '@/components/email/EmailCard';
import { EmailDivider } from '@/components/email/EmailDivider';
import { EmailHeading } from '@/components/email/EmailHeading';
import { EmailSection } from '@/components/email/EmailSection';
import { EmailText } from '@/components/email/EmailText';
import { EmailWrapper } from '@/components/email/EmailWrapper';
import { Img } from '@/components/email/Img';
```

---

## 次のステップ

### エラーが発生した

- **よくあるエラー集**: `docs/for-non-engineers/common-errors.md`

### ブランドガイドを確認したい

- **kozokaAI ブランドガイド**: `docs/for-non-engineers/brand-guide.md`

### 初めてメールを作成する

- **初心者向けガイド**: `docs/for-non-engineers/getting-started.md`

---

**最終更新日**: 2026-01-21
