# よくあるエラー集

このガイドは、メールデザイン中に発生しやすい**エラーと解決策**を、診断フローチャート付きで説明します。エラーが発生したら、まずこのガイドを確認してください。

---

## 目次

1. [メールが表示されない](#1-メールが表示されない)
2. [画像が表示されない](#2-画像が表示されない)
3. [Tailwind CSS クラスが効かない](#3-tailwind-css-クラスが効かない)
4. [pnpm run commit エラー](#4-pnpm-run-commit-エラー)
5. [GitHub Actions エラー](#5-github-actions-エラー)

---

## 1. メールが表示されない

### 症状

- ブラウザで `http://localhost:3000` を開いても、メールが表示されない
- 白い画面が表示される
- エラーメッセージが表示される

### 診断フローチャート

```
START
  ↓
ブラウザのコンソールを確認（F12 → Console タブ）
  ↓
エラーメッセージがある？
  ├─ YES → エラーメッセージを読む
  │           ↓
  │        「Unexpected token」または「Unexpected identifier」
  │           ↓
  │        → 原因A: 構文エラー（閉じタグ忘れ、カンマ忘れ）
  │
  ├─ NO  → pnpm run dev の実行状態を確認
  │           ↓
  │        「Ready in X.Xs」と表示されている？
  │           ├─ YES → src/app/page.tsx を確認
  │           │           ↓
  │           │        previewText が設定されている？
  │           │           ├─ YES → 原因C: インポート漏れ
  │           │           └─ NO  → 原因B: previewText 未設定
  │           │
  │           └─ NO  → pnpm run dev を再実行
  │
  └─ その他 → エンジニアに相談
```

### よくある原因

#### 原因A: 構文エラー（閉じタグ忘れ、カンマ忘れ）

**症状:**
```
Error: Unexpected token '<'
Error: Unexpected identifier
```

**原因:**
- 閉じタグ（`</EmailHeading>`）を忘れた
- カンマ（`,`）を忘れた
- 括弧（`()`、`{}`）の対応が間違っている

**解決手順:**

1. **Cursor AI にエラー箇所を確認させる**
   - Cursor IDE でエラーメッセージをコピー
   - Cursor AI に「このエラーを修正して」と依頼

2. **手動で確認する場合**
   - `src/app/page.tsx` を開く
   - 閉じタグが正しく対応しているか確認

**具体例:**

```typescript
// ❌ 間違い（</EmailHeading> 忘れ）
<EmailHeading>サマーセール開催中

<EmailText>
  最大50%OFFのお得なセールを開催しています。
</EmailText>

// ✅ 正解
<EmailHeading>サマーセール開催中</EmailHeading>

<EmailText>
  最大50%OFFのお得なセールを開催しています。
</EmailText>
```

#### 原因B: previewText 未設定

**症状:**
- メールは表示されるが、プレビューテキストが空
- EmailWrapper のエラーが表示される

**原因:**
- `EmailWrapper` の `previewText` プロパティが未設定

**解決手順:**

1. **src/app/page.tsx を開く**
2. **EmailWrapper に previewText を追加**

**具体例:**

```typescript
// ❌ 間違い（previewText なし）
<EmailWrapper>
  <EmailSection>
    <EmailHeading>サマーセール開催中</EmailHeading>
  </EmailSection>
</EmailWrapper>

// ✅ 正解
<EmailWrapper previewText="サマーセール最大50%OFF！この機会をお見逃しなく。">
  <EmailSection>
    <EmailHeading>サマーセール開催中</EmailHeading>
  </EmailSection>
</EmailWrapper>
```

#### 原因C: インポート漏れ

**症状:**
```
Error: EmailButton is not defined
Error: Img is not defined
```

**原因:**
- コンポーネントのインポート文が不足している

**解決手順:**

1. **src/app/page.tsx の先頭を確認**
2. **必要なコンポーネントをすべてインポート**

**具体例:**

```typescript
// ❌ 間違い（EmailButton のインポート忘れ）
import { EmailHeading } from '@/components/email/EmailHeading';
import { EmailSection } from '@/components/email/EmailSection';
import { EmailText } from '@/components/email/EmailText';
import { EmailWrapper } from '@/components/email/EmailWrapper';

// ✅ 正解（すべてインポート）
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

## 2. 画像が表示されない

### 症状

- メールは表示されるが、画像が表示されない
- 画像の代わりに alt テキストが表示される
- 画像の場所に「×」マークが表示される

### 診断フローチャート

```
START
  ↓
画像ファイルの存在を確認
  ↓
public/MAIL-ASSETS/ に画像がある？
  ├─ YES → 画像ファイル名を確認
  │           ↓
  │        ファイル名が正しい？
  │           ├─ YES → Img コンポーネントを確認
  │           │           ↓
  │           │        Img コンポーネントを使っている？
  │           │           ├─ YES → width と height を確認
  │           │           │           ↓
  │           │           │        設定されている？
  │           │           │           ├─ YES → エンジニアに相談
  │           │           │           └─ NO  → 原因D: width/height 未設定
  │           │           │
  │           │           └─ NO  → 原因C: <img> タグを使用
  │           │
  │           └─ NO  → 原因A: ファイル名のタイポ
  │
  └─ NO  → 画像を配置（public/MAIL-ASSETS/）
```

### よくある原因

#### 原因A: 画像ファイル名のタイポ

**症状:**
- 画像が表示されない
- ブラウザのコンソールに `404 Not Found` エラー

**原因:**
- 画像ファイル名のスペルミス
- 大文字・小文字の間違い

**解決手順:**

1. **public/MAIL-ASSETS/ のファイル名を確認**
2. **src/app/page.tsx の画像パスを修正**

**具体例:**

```typescript
// public/MAIL-ASSETS/ に配置されているファイル
// hero.png （正しいファイル名）

// ❌ 間違い（helo.png → タイポ）
<Img src="/MAIL-ASSETS/helo.png" alt="ヒーロー画像" width={560} height={293} />

// ✅ 正解（hero.png）
<Img src="/MAIL-ASSETS/hero.png" alt="ヒーロー画像" width={560} height={293} />
```

#### 原因B: 画像パスの誤り

**症状:**
- 画像が表示されない
- ブラウザのコンソールに `404 Not Found` エラー

**原因:**
- 画像パスが `/MAIL-ASSETS/` ではない
- 絶対パスを使用していない

**解決手順:**

1. **画像パスを `/MAIL-ASSETS/` に修正**

**具体例:**

```typescript
// ❌ 間違い（/ASSETS/ → パス誤り）
<Img src="/ASSETS/hero.png" alt="ヒーロー画像" width={560} height={293} />

// ❌ 間違い（相対パス）
<Img src="./MAIL-ASSETS/hero.png" alt="ヒーロー画像" width={560} height={293} />

// ✅ 正解（/MAIL-ASSETS/ → 絶対パス）
<Img src="/MAIL-ASSETS/hero.png" alt="ヒーロー画像" width={560} height={293} />
```

#### 原因C: `<img>` タグを使用

**症状:**
- 開発時は画像が表示されるが、本番環境で表示されない

**原因:**
- `Img` コンポーネントではなく、`<img>` タグを使用している
- 本番環境では画像パスが S3 URL に自動的に置換されるため、`Img` コンポーネントが必要

**解決手順:**

1. **`<img>` タグを `Img` コンポーネントに変更**
2. **インポート文を追加**

**具体例:**

```typescript
// ❌ 間違い（<img> タグ）
<img src="/MAIL-ASSETS/hero.png" alt="ヒーロー画像" />

// ✅ 正解（Img コンポーネント）
<Img src="/MAIL-ASSETS/hero.png" alt="ヒーロー画像" width={560} height={293} />
```

**インポート文:**
```typescript
import { Img } from '@/components/email/Img';
```

#### 原因D: width と height が未設定

**症状:**
- 画像が表示されない
- 画像のサイズがおかしい

**原因:**
- `Img` コンポーネントの `width` と `height` プロパティが未設定

**解決手順:**

1. **width と height を追加**

**具体例:**

```typescript
// ❌ 間違い（width/height なし）
<Img src="/MAIL-ASSETS/hero.png" alt="ヒーロー画像" />

// ✅ 正解（width/height 必須）
<Img src="/MAIL-ASSETS/hero.png" alt="ヒーロー画像" width={560} height={293} />
```

**画像サイズ:**
- ヘッダー画像: 560×293px
- フッター画像: 200×105px

---

## 3. Tailwind CSS クラスが効かない

### 症状

- Tailwind CSS クラス（`className="bg-white p-4"`）を使っても、スタイルが適用されない
- ブラウザプレビューでは正しく表示されるが、メールでは正しく表示されない

### 原因

- **メールクライアント（Outlook、Gmail）は Tailwind CSS に対応していません**
- Tailwind CSS クラスは、ブラウザでは正しく表示されますが、メールでは表示されません

### 解決手順

1. **Tailwind CSS クラスをインラインスタイルに変換**
2. **Cursor AI に依頼すると自動的に変換してくれます**

### 具体例

```typescript
// ❌ 間違い（Tailwind CSS クラス）
<div className="bg-white p-4 text-center">
  コンテンツ
</div>

// ✅ 正解（インラインスタイル）
<div style={{ backgroundColor: '#ffffff', padding: '16px', textAlign: 'center' }}>
  コンテンツ
</div>
```

### Tailwind CSS → インラインスタイル 変換表

| Tailwind CSS クラス | インラインスタイル |
|---------------------|-------------------|
| `bg-white` | `backgroundColor: '#ffffff'` |
| `p-4` | `padding: '16px'` |
| `text-center` | `textAlign: 'center'` |
| `text-gray-600` | `color: '#475569'` |
| `font-bold` | `fontWeight: 'bold'` |
| `rounded` | `borderRadius: '8px'` |

### Cursor AI への依頼例

```
このTailwind CSSクラスをインラインスタイルに変換してください。

<div className="bg-white p-4 text-center">
  コンテンツ
</div>
```

Cursor AI が自動的に以下のように変換します:

```typescript
<div style={{ backgroundColor: '#ffffff', padding: '16px', textAlign: 'center' }}>
  コンテンツ
</div>
```

---

## 4. pnpm run commit エラー

### 症状

- `pnpm run commit` を実行すると、エラーが発生する

### よくあるエラーと解決策

#### エラーA: `draft/page.tsx が見つかりません`

**エラーメッセージ:**
```bash
Error: src/app/draft/page.tsx が見つかりません
```

**原因:**
- `src/app/draft/page.tsx` が存在しない

**解決手順:**

1. **template.tsx から復元**

```bash
cp src/app/draft/template.tsx src/app/draft/page.tsx
```

2. **メール作成を再開**
   - `src/app/draft/page.tsx` を開く
   - メールコンテンツを作成

#### エラーB: `MAIL-ASSETS/ に画像がありません`

**エラーメッセージ:**
```bash
Error: public/MAIL-ASSETS/ に画像がありません
```

**原因:**
- `public/MAIL-ASSETS/` に画像が配置されていない

**解決手順:**

1. **画像を public/MAIL-ASSETS/ に配置**
   - ヘッダー画像: 560×293px
   - フッター画像: 200×105px

2. **pnpm run commit を再実行**

#### エラーC: `Segment ID が不正です`

**エラーメッセージ:**
```bash
Error: Segment ID が不正です
```

**原因:**
- Resend Segment ID の形式が間違っている

**解決手順:**

1. **Resend Dashboard で Segment ID を確認**
   - https://resend.com/audiences
   - Segment ID をコピー

2. **正しい形式の Segment ID を入力**
   - 例: `78261eea-8f8b-4381-83c6-79fa7120f1cf`

---

## 5. GitHub Actions エラー

### 症状

- Pull Request を作成後、GitHub Actions のチェックが失敗する

### よくあるエラーと解決策

#### エラーA: Check Workflow 失敗（Lint エラー）

**エラーメッセージ:**
```bash
Error: ESLint errors found
```

**原因:**
- コードスタイルの問題（未使用の変数、セミコロン忘れなど）

**解決手順:**

1. **ローカルで Lint を実行**

```bash
pnpm run lint
```

2. **エラーを修正**
   - Cursor AI に「Lint エラーを修正して」と依頼

3. **コミット & プッシュ**

```bash
git add .
git commit -m "FIX: Lint errors"
git push
```

#### エラーB: Check Workflow 失敗（型エラー）

**エラーメッセージ:**
```bash
Error: Type 'string' is not assignable to type 'number'
```

**原因:**
- TypeScript の型エラー

**解決手順:**

1. **ローカルで型チェックを実行**

```bash
pnpm run type-check
```

2. **エラーを修正**
   - Cursor AI に「型エラーを修正して」と依頼

3. **コミット & プッシュ**

#### エラーC: Staging Workflow 失敗（S3 アップロードエラー）

**エラーメッセージ:**
```bash
Error: Failed to upload to S3
```

**原因:**
- AWS 認証情報が正しくない
- S3 バケットが存在しない

**解決手順:**

1. **エンジニアに相談**
   - AWS 認証情報の確認を依頼
   - S3 バケットの存在確認を依頼

#### エラーD: Staging Workflow 失敗（テストメール送信エラー）

**エラーメッセージ:**
```bash
Error: Failed to send test email
```

**原因:**
- Resend API キーが正しくない
- REVIEWER_EMAIL が設定されていない

**解決手順:**

1. **エンジニアに相談**
   - Resend API キーの確認を依頼
   - REVIEWER_EMAIL の設定確認を依頼

---

## トラブルシューティングのコツ

### 1. エラーメッセージをよく読む

- エラーメッセージには、問題の原因が記載されています
- 「何行目」「どのファイル」に問題があるか確認してください

### 2. Cursor AI に依頼する

- エラーメッセージをコピーして、Cursor AI に「このエラーを修正して」と依頼
- Cursor AI が自動的に診断・修正してくれます

### 3. ブラウザのコンソールを確認

- ブラウザのコンソール（F12 → Console タブ）を開く
- エラーメッセージが表示されているか確認

### 4. ローカルで確認してからコミット

- `pnpm run dev` でローカルプレビューを確認
- `pnpm run lint` で Lint エラーを確認
- `pnpm run type-check` で型エラーを確認

### 5. エンジニアに相談

- 上記の手順で解決しない場合は、エンジニアに相談してください
- エラーメッセージをコピーして共有すると、スムーズに解決できます

---

## 次のステップ

### 初めてメールを作成する

- **初心者向けガイド**: `docs/for-non-engineers/getting-started.md`

### コンポーネントを使いたい

- **コンポーネントリファレンス**: `docs/for-non-engineers/component-reference.md`

### ブランドガイドを確認したい

- **kozokaAI ブランドガイド**: `docs/for-non-engineers/brand-guide.md`

---

**最終更新日**: 2026-01-21
