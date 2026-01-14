# kozokaAI メールマガジン デザインシステム

## 概要

kozokaAI メールマガジン配信システムのデザインシステム仕様書です。メールテンプレート用のブランドカラー、システムカラー、フォント、コンポーネントスタイルの統一されたガイドラインを提供します。

**技術スタック**
- Next.js 16.1.0 (App Router)
- React Email (@react-email/components)
- インラインスタイル（メールクライアント互換性のため）
- Shadcn UI デザインシステムを参考

---

## カラーパレット

### ブランドカラー

#### プライマリカラー
- **Primary**: `#00ADAA`
  - 使用箇所: メインCTA、ブランドコンポーネント
  - ユーティリティ: `bg-brand-primary`, `border-brand-primary`

- **Primary Hover/Active**: `#009A97`
  - 使用箇所: プライマリボタンのホバー／アクティブ状態
  - ユーティリティ: `hover:bg-brand-primary-dark`, `hover:border-brand-primary-dark`

#### アクセントカラー
- **Accent Text**: `#008C8A`
  - 使用箇所: 統計値、強調テキスト
  - ユーティリティ: `text-brand-accent`

- **Accent Badge**: `#00DED9`
  - 使用箇所: バッジ、情報タグ
  - ユーティリティ: `bg-brand-accent-soft`, `text-brand-accent-strong`

### 基本色

#### ニュートラルカラー
- **White**: `#ffffff`
  - 使用箇所: 背景、テキストボタン背景
  - Tailwind: `bg-white`, `text-white`

- **Black**: `#000000`
  - 使用箇所: テキスト、ボーダー
  - Tailwind: `bg-black`, `text-black`, `border-black`

- **Light Gray**: `#f0f0f0`
  - 使用箇所: ホワイトボタンホバー背景
  - Tailwind: `hover:bg-[#f0f0f0]`

### システムカラー（Shadcn UI スタイル）

メールテンプレートでは、Shadcn UIのデザインシステムを参考にしたslate系のカラーパレットを使用します。メールクライアント互換性のため、インラインスタイルで直接指定します。

#### Slate系カラーパレット（メールテンプレート用）

メールテンプレートでは以下のslate系カラーを使用します：

- **背景色**: `#f1f5f9` (slate-100) - EmailWrapperの外側背景
- **カード背景**: `#ffffff` (white) - メインコンテンツエリア
- **カード背景（セカンダリ）**: `#f8fafc` (slate-50) - コンテンツカード内
- **テキスト（プライマリ）**: `#0f172a` (slate-900) - 見出し
- **テキスト（セカンダリ）**: `#64748b` (slate-500) - サブテキスト
- **テキスト（本文）**: `#1e293b` (slate-800) - 本文
- **テキスト（ミュート）**: `#94a3b8` (slate-400) - フッター
- **ボーダー**: `#e2e8f0` (slate-200) - カードボーダー
- **プライマリボタン**: `#2563eb` (blue-600) - CTAボタン

---

## 使用方法

### メールテンプレートでの使用

**重要**: メールクライアント互換性のため、メールテンプレート（`src/app/draft/page.tsx`）では**インラインスタイルのみ**を使用します。Tailwind CSSクラスやCSS変数は使用できません。

### インラインスタイル（メールテンプレート用）

```tsx
// メールテンプレートでの使用例
import { EmailWrapper } from '@/components/email/EmailWrapper';

export default function DraftEmail() {
  return (
    <EmailWrapper previewText="プレビューテキスト">
      {/* タイトル */}
      <h1
        style={{
          margin: '0 0 8px 0',
          fontSize: '30px',
          fontWeight: 600,
          color: '#0f172a', // slate-900
          lineHeight: '1.2',
          letterSpacing: '-0.025em',
        }}
      >
        メールタイトル
      </h1>

      {/* サブテキスト */}
      <p
        style={{
          margin: 0,
          fontSize: '16px',
          color: '#64748b', // slate-500
          lineHeight: '1.5',
        }}
      >
        サブテキスト
      </p>

      {/* コンテンツカード */}
      <div
        style={{
          marginBottom: '24px',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0', // slate-200
          backgroundColor: '#f8fafc', // slate-50
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '15px',
            color: '#1e293b', // slate-800
            lineHeight: '1.6',
          }}
        >
          コンテンツ
        </p>
      </div>

      {/* CTAボタン */}
      <div style={{ textAlign: 'center' }}>
        <a
          href="https://example.com"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: '#2563eb', // blue-600
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 500,
            lineHeight: '1.5',
          }}
        >
          詳細を見る
        </a>
      </div>
    </EmailWrapper>
  );
}
```

---

## 実装例（メールテンプレート用）

### プライマリボタン
```tsx
<a
  href="https://example.com"
  style={{
    display: 'inline-block',
    padding: '10px 24px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: '1.5',
  }}
>
  詳細を見る
</a>
```

### コンテンツカード
```tsx
<div
  style={{
    marginBottom: '24px',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  }}
>
  <p
    style={{
      margin: 0,
      fontSize: '15px',
      color: '#1e293b',
      lineHeight: '1.6',
    }}
  >
    カードコンテンツ
  </p>
</div>
```

### 画像カード
```tsx
<div
  style={{
    marginBottom: '24px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  }}
>
  <Img
    src="/mail-assets/hero.jpg"
    alt="ヒーロー画像"
    width="520"
    style={{
      width: '100%',
      height: 'auto',
      display: 'block',
    }}
  />
</div>
```

### 区切り線
```tsx
<hr
  style={{
    margin: '24px 0',
    border: 'none',
    borderTop: '1px solid #e2e8f0',
  }}
/>
```

---

## フォントシステム

### フォントファミリー（メールテンプレート用）

メールテンプレートでは、メールクライアント互換性の高いシステムフォントを使用します。

```tsx
// EmailWrapperで設定
fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
```

### フォントサイズ

- **見出し（h1）**: `30px`, `fontWeight: 600`
- **見出し（h2）**: `24px`, `fontWeight: 600`
- **本文**: `15px`, `fontWeight: 400`
- **サブテキスト**: `16px`, `fontWeight: 400`
- **フッター**: `14px`, `fontWeight: 400`

---

## レイアウト・スペーシング

### スペーシング（メールテンプレート用）

メールテンプレートでは、24pxベースのスペーシングシステムを使用します。

- **セクション間**: `24px` (marginBottom)
- **カード内パディング**: `24px`
- **要素間**: `16px` または `8px`

### Border Radius

- **カード**: `8px`
- **ボタン**: `6px`
- **画像**: `8px` または `6px`

### メール幅

- **最大幅**: `600px` (EmailWrapperで設定)
- **パディング**: `40px` (EmailWrapper内側)

---

## 技術仕様

### メールテンプレート技術スタック

- **Next.js**: 16.1.0 (App Router)
- **React Email**: @react-email/components, @react-email/render
- **スタイリング**: インラインスタイルのみ（メールクライアント互換性のため）
- **デザインシステム**: Shadcn UIスタイルを参考

### メールクライアント互換性

**重要**: メールテンプレートでは以下の制約があります：

- ❌ Tailwind CSSクラスは使用不可
- ❌ CSS変数は使用不可
- ❌ Flexbox/Gridは使用不可（多くのメールクライアントで非対応）
- ✅ インラインスタイルのみ使用
- ✅ `<table>` タグでレイアウト（EmailWrapperで実装）
- ✅ 固定幅（600px）で中央揃え

---

## ベストプラクティス

### メールテンプレート作成ガイドライン

#### ✅ 推奨
- インラインスタイルのみを使用（メールクライアント互換性のため）
- Shadcn UIスタイルのslate系カラーパレットを使用
- 24pxベースのスペーシングシステムを維持
- EmailWrapperコンポーネントを使用（テーブルレイアウト）
- 画像は`<Img>`コンポーネントを使用（パス解決のため）
- カードベースのレイアウトで階層を表現
- 控えめなシャドウとボーダーで視覚的階層を作成

#### ❌ 非推奨
- Tailwind CSSクラスの使用（メールクライアントで非対応）
- CSS変数の使用（メールクライアントで非対応）
- Flexbox/Gridの使用（多くのメールクライアントで非対応）
- 複雑なCSSアニメーション（メールクライアントで非対応）
- 絵文字の使用（理由: ブラウザ・OSによる表示差異、アクセシビリティ問題）

### 画像使用ガイドライン

#### 画像コンポーネント
- **Img**: `@/components/email/Img` を使用
- 開発時: `/mail-assets/` パス
- 本番時: S3 URLに自動置換

#### 画像使用例
```tsx
import { Img } from '@/components/email/Img';

<Img
  src="/mail-assets/hero.jpg"
  alt="ヒーロー画像"
  width="520"
  style={{
    width: '100%',
    height: 'auto',
    display: 'block',
  }}
/>
```

#### ✅ 画像の適切な使用
- 画像は`public/mail-assets/`に配置
- `alt`属性を必ず指定（アクセシビリティ）
- `width`属性を指定（メールクライアント互換性）
- カード内に配置して視覚的階層を作成

#### ❌ 避けるべき画像使用
- 画像のみで情報を伝達（テキストも併用）
- 過度に大きな画像（メールサイズ制限）
- 外部URLの直接指定（S3経由を推奨）

### アクセシビリティ
- 十分なコントラスト比を確保（slate-900 on white など）
- カラーのみに依存しない情報伝達
- 画像には必ず`alt`属性を指定
- リンクには明確なテキストを提供

### メールクライアント互換性
- インラインスタイルのみ使用
- テーブルレイアウトで構造化（EmailWrapperで実装）
- 固定幅（600px）で中央揃え
- 画像は`width`属性を指定
- 複雑なCSSは避ける（多くのメールクライアントで非対応）

---

## 更新履歴

- **2025-12-29**: メールマガジン配信システム向けに更新
  - プロジェクト概要をメールマガジン配信システムに変更
  - メールテンプレート用のデザインシステムとして再構成
  - インラインスタイルの使用を強調（メールクライアント互換性）
  - Shadcn UIスタイルのslate系カラーパレットを採用
  - メールテンプレート用の実装例を追加
  - 画像使用ガイドラインを追加

- **2025-12-02**: 絵文字使用ガイドラインとアイコン使用セクションを追加
  - 絵文字使用を非推奨として明記（理由: ブラウザ・OSによる表示差異、アクセシビリティ問題）

- **2025-10-20**: 初版作成
  - 全カラーパレットの調査・定義
  - システムカラーとブランドカラーの明確化
  - 実装例とベストプラクティスの追加

---

## 参考リンク

- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Email Documentation](https://react.email/docs)
- [Resend Documentation](https://resend.com/docs)

## ファイル参照

- メールテンプレート: `src/app/draft/page.tsx`
- EmailWrapper: `src/components/email/EmailWrapper.tsx`
- Imgコンポーネント: `src/components/email/Img.tsx`
- プロジェクト概要: `CLAUDE.md`