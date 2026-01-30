# kozokaAI ブランドガイド

このガイドは、kozokaAI のメールマガジンにおける**ブランド一貫性**を維持するためのルールを定義します。メールを作成する際は、このガイドに従ってください。

---

## 目次

1. [会社情報](#1-会社情報)
2. [製品ラインナップ](#2-製品ラインナップ)
3. [ブランドカラー](#3-ブランドカラー)
4. [タイポグラフィ](#4-タイポグラフィ)
5. [トーン＆マナー](#5-トーンマナー)
6. [画像サイズ](#6-画像サイズ)
7. [必須構成要素](#7-必須構成要素)
8. [配信前チェックリスト](#8-配信前チェックリスト)

---

## 1. 会社情報

### 会社名

**正式名称:**
- 日本語: 株式会社kozokaAI
- 英語: kozokaAI Inc.

**表記ルール:**
- ✅ 正解: `kozokaAI`（小文字k、大文字A、大文字I）
- ❌ 間違い: `KozokaAI`、`kozoka AI`、`kozoka-AI`

### 送信者情報

**送信者名:**
```
kozokaAI マーケティングチーム
```

**送信元アドレス:**
```
newsletter@kozokaai.jp
```

**Web サイト:**
```
https://www.kozoka-ai.co.jp
```

### 住所

```
東京都港区六本木6-10-1
六本木ヒルズ森タワー 17F
```

### 使用例

```typescript
<EmailText>
  株式会社kozokaAI マーケティングチームです。
</EmailText>

<EmailButton href="https://www.kozoka-ai.co.jp" backgroundColor="#00ADAA">
  詳しく見る
</EmailButton>
```

---

## 2. 製品ラインナップ

### 正確な製品名・表記

kozokaAI の製品名は、**正確に記載**してください。略称や誤表記は避けてください。

#### 製品1: FAX受注入力AI

**正式名称:**
```
FAX受注入力AI
```

**URL:**
```
https://kozoka.ai/fax
```

**読み方:**
```
ファックスじゅちゅうにゅうりょくエーアイ
```

**説明:**
```
FAX で受信した注文書を自動でデジタル化し、基幹システムに入力します。
手作業での入力作業を削減し、業務効率を大幅に向上させます。
```

**イメージキャラクター:**
```
注注くん（ちゅうちゅうくん）
```

**表記ルール:**
- ✅ 正解: `FAX受注入力AI`
- ❌ 間違い: `FAX注文AI`、`FAX入力システム`、`FAXジュチュウAI`

#### 製品2: 商談ログAI

**正式名称:**
```
商談ログAI
```

**URL:**
```
https://kozoka.ai/voice
```

**読み方:**
```
しょうだんログエーアイ
```

**説明:**
```
商談内容を自動で記録・分析し、営業活動の可視化と効率化を実現します。
営業担当者の事務作業時間を削減し、顧客対応に集中できます。
```

**表記ルール:**
- ✅ 正解: `商談ログAI`
- ❌ 間違い: `商談記録AI`、`営業ログAI`、`ショウダンAI`

#### 製品3: インサイトAI

**正式名称:**
```
インサイトAI
```

**URL:**
```
https://kozoka.ai/insight
```

**読み方:**
```
インサイトエーアイ
```

**説明:**
```
基幹システム（ERP、販売管理、会計システムなど）のデータから、
経営インサイトを自動抽出し、データドリブンな意思決定を支援します。
```

**表記ルール:**
- ✅ 正解: `インサイトAI`
- ❌ 間違い: `基幹データAIインサイト`、`基幹システムAI`、`データインサイト`

### 使用例

```typescript
<EmailText>
  FAX受注入力AI の新バージョンをリリースしました。
  精度が大幅に向上し、処理速度も50%高速化しています。
</EmailText>

<EmailText>
  商談ログAI を導入することで、営業担当者の事務作業時間を70%削減できます。
</EmailText>

<EmailText>
  インサイトAI で、売上予測の精度が向上しました。
</EmailText>

<EmailText>
  注注くん（FAX受注入力AIのイメージキャラクター）が24時間365日、自動で注文を受け付けます。
</EmailText>
```

---

## 3. ブランドカラー

### プライマリカラー

**HEX:**
```
#00ADAA
```

**RGB:**
```
rgb(0, 173, 170)
```

**色見本:**
```
████████ #00ADAA（ターコイズブルー）
```

**用途:**
- ボタンの背景色
- リンクの色
- 強調したいテキストの色
- カードの境界線の色

### ホバーカラー

**HEX:**
```
#009A97
```

**RGB:**
```
rgb(0, 154, 151)
```

**色見本:**
```
████████ #009A97（ダークターコイズブルー）
```

**用途:**
- ボタンのホバー状態の背景色

### 使用例

```typescript
// ボタン
<EmailButton href="https://www.kozoka-ai.co.jp" backgroundColor="#00ADAA">
  詳しく見る
</EmailButton>

// 見出し（強調）
<EmailHeading color="#00ADAA">
  新製品リリースのお知らせ
</EmailHeading>

// カード（境界線）
<EmailCard borderColor="#00ADAA">
  <EmailHeading>重要なお知らせ</EmailHeading>
</EmailCard>

// 区切り線
<EmailDivider color="#00ADAA" height="2px" />
```

### 色の使い分け

| 要素 | 推奨色 | 理由 |
|------|-------|------|
| ボタン | `#00ADAA` | ブランドカラーで統一感 |
| 見出し | `#1e293b` | 読みやすさ優先 |
| 本文 | `#475569` | 読みやすさ優先 |
| 強調テキスト | `#00ADAA` | ブランドカラーで強調 |
| カード境界線 | `#e2e8f0` または `#00ADAA` | 薄いグレーまたはブランドカラー |

---

## 4. タイポグラフィ

### 見出し（EmailHeading）

**フォントサイズ:**
```
18px
```

**フォントウェイト:**
```
bold（太字）
```

**カラー:**
```
#1e293b（ダークグレー）
```

**用途:**
- セクションのタイトル
- カードの見出し

### 本文（EmailText）

**フォントサイズ:**
```
15px
```

**フォントウェイト:**
```
normal（標準）
```

**カラー:**
```
#475569（グレー）
```

**行間:**
```
1.6
```

**用途:**
- メールの本文
- 段落ごとのテキスト

### 小さいテキスト

**フォントサイズ:**
```
13px
```

**フォントウェイト:**
```
normal（標準）
```

**カラー:**
```
#64748b（ライトグレー）
```

**用途:**
- 注意書き
- フッターの署名
- 補足情報

### 使用例

```typescript
// 見出し
<EmailHeading>サマーセール開催中</EmailHeading>

// 本文
<EmailText>
  最大50%OFFのお得なセールを開催しています。
  この機会をお見逃しなく。
</EmailText>

// 小さいテキスト（注意書き）
<EmailText fontSize="13px" color="#64748b">
  ※ このメールは、kozokaAI のサービスをご利用いただいているお客様に配信しています。
</EmailText>
```

---

## 5. トーン＆マナー

### 基本トーン

kozokaAI のメールマガジンは、**プロフェッショナルで親しみやすい**トーンを維持します。

**基本ルール:**
- ✅ 「です・ます」調（丁寧語）
- ✅ プロフェッショナルで親しみやすい
- ✅ 技術的な説明も分かりやすく
- ❌ 「である」調は使わない
- ❌ 過度にカジュアルな表現は避ける

### 避けるべき表現

| 表現 | 理由 |
|------|------|
| ❌ 「ヤバい」「マジで」 | カジュアルすぎる |
| ❌ 「絶対」「必ず」 | 断定的すぎる |
| ❌ 「!!!」（過度な感嘆符） | プロフェッショナルさが損なわれる |
| ❌ 絵文字（🎉、😊など） | ブラウザ・OS によって表示が異なる |

### 推奨される表現

| 表現 | 用途 |
|------|------|
| ✅ 「おすすめです」 | 製品やサービスを紹介する |
| ✅ 「ぜひご覧ください」 | CTA（行動喚起） |
| ✅ 「大幅に効率化できます」 | 効果を説明する |
| ✅ 「業務改善に貢献します」 | ベネフィットを強調する |
| ✅ 「お気軽にお問い合わせください」 | コンタクトを促す |

### 使用例

```typescript
// ✅ 正解（プロフェッショナルで親しみやすい）
<EmailText>
  kozokaAI マーケティングチームです。
  いつもご愛読いただき、ありがとうございます。
</EmailText>

<EmailText>
  FAX受注入力AI の新バージョンをリリースしました。
  精度が大幅に向上し、処理速度も50%高速化しています。
  ぜひお試しください。
</EmailText>

// ❌ 間違い（カジュアルすぎる）
<EmailText>
  やあ！kozokaAI だよ。
  新しいAI、マジでヤバいから使ってみて！！！
</EmailText>
```

---

## 6. 画像サイズ

### ヘッダー画像

**サイズ:**
```
560×293px
```

**ファイル形式:**
```
PNG または JPG
```

**配置場所:**
```
public/MAIL-ASSETS/hero.png
```

**用途:**
- メールの冒頭に配置するヘッダー画像
- ブランドイメージを伝える

### フッター画像

**サイズ:**
```
200×105px
```

**ファイル形式:**
```
PNG または JPG
```

**配置場所:**
```
public/MAIL-ASSETS/footer.png
```

**用途:**
- メールの末尾に配置するフッター画像
- kozokaAI ロゴ

### 使用例

```typescript
// ヘッダー画像
<EmailSection>
  <Img
    src="/MAIL-ASSETS/hero.png"
    alt="kozokaAI BOOSTマガジン ヘッダー"
    width={560}
    height={293}
  />
</EmailSection>

// フッター画像
<EmailSection>
  <Img
    src="/MAIL-ASSETS/footer.png"
    alt="kozokaAI ロゴ"
    width={200}
    height={105}
  />
</EmailSection>
```

---

## 7. 必須構成要素

すべてのメールマガジンには、以下の構成要素を**必ず含めてください**。

### 1. プレビューテキスト

**説明:**
- メールクライアントの一覧画面で表示されるテキスト
- 50〜80文字程度

**設定場所:**
```typescript
<EmailWrapper previewText="ここにプレビューテキストを記述">
```

**例:**
```
サマーセール最大50%OFF！この機会をお見逃しなく。
```

### 2. フッター署名

**説明:**
- メールの末尾に配置する署名
- 送信者名、Web サイト、住所を含む

**設定場所:**
- EmailFooter コンポーネント（自動的に追加されます）

**内容:**
```
kozokaAI マーケティングチーム
https://www.kozoka-ai.co.jp

東京都港区六本木6-10-1
六本木ヒルズ森タワー 17F
```

### 3. 配信停止リンク

**説明:**
- FTC（米国）および GDPR（欧州）の法的要件で必須
- EmailFooter コンポーネントに自動的に含まれます

**設定場所:**
- EmailFooter コンポーネント（自動的に追加されます）

**内容:**
```
配信停止 / Unsubscribe
```

**重要:**
- **絶対に削除しないでください**
- 削除すると法律違反になります

---

## 8. 配信前チェックリスト

メールを配信する前に、以下のチェックリストを**必ず確認**してください。

### コンテンツチェック

- [ ] **プレビューテキストが設定されている**（50〜80文字）
- [ ] **ブランドカラー（#00ADAA）が使用されている**（ボタン、リンクなど）
- [ ] **製品名が正確に記載されている**（FAX受注入力AI、商談ログAI、インサイトAI）
- [ ] **「です・ます」調で記述されている**（丁寧語）
- [ ] **絵文字を使用していない**（ブラウザ・OS によって表示が異なる）

### 画像チェック

- [ ] **画像のサイズが正しい**（ヘッダー: 560×293px、フッター: 200×105px）
- [ ] **画像パスが `/MAIL-ASSETS/` で始まっている**（`Img` コンポーネント使用）
- [ ] **alt テキストが設定されている**（スクリーンリーダー用）

### スタイルチェック

- [ ] **Tailwind CSS クラスではなく、インラインスタイルを使用している**
- [ ] **Flexbox や Grid を使用していない**（メールクライアント非対応）

### 構成要素チェック

- [ ] **EmailFooter が含まれている**（自動的に追加されます）
- [ ] **配信停止リンクが含まれている**（EmailFooter 内）
- [ ] **フッター署名が含まれている**（EmailFooter 内）

### リンクチェック

- [ ] **リンク URL が正しい**（https://www.kozoka-ai.co.jp など）
- [ ] **ボタンのリンクが機能する**（EmailButton の `href` プロパティ）

### テストメールチェック

- [ ] **テストメールを確認した**（REVIEWER_EMAIL に送信）
- [ ] **件名が正しい**
- [ ] **本文が正しく表示されている**
- [ ] **画像が正しく表示されている**
- [ ] **ボタンのリンクが正しい**
- [ ] **配信停止リンクが含まれている**

### レビューチェック

- [ ] **レビュアー（上司またはエンジニア）の承認を得た**
- [ ] **Pull Request が承認された**
- [ ] **GitHub Actions のチェックがすべて成功している**

---

## 使用例: kozokaAI BOOST マガジン

### 完全な実装例

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
        <EmailCard borderColor="#00ADAA">
          <EmailHeading color="#00ADAA">新製品リリースのお知らせ</EmailHeading>
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
      <EmailDivider color="#e2e8f0" />

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

## 次のステップ

### 初めてメールを作成する

- **初心者向けガイド**: `docs/for-non-engineers/getting-started.md`

### コンポーネントを使いたい

- **コンポーネントリファレンス**: `docs/for-non-engineers/component-reference.md`

### エラーが発生した

- **よくあるエラー集**: `docs/for-non-engineers/common-errors.md`

---

**最終更新日**: 2026-01-21
