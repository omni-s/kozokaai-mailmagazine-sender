# Custom Return Path 設定手順書

## 概要

現在、メールの「送信元（mailed-by）」が `ap-northeast-1.amazonses.com` と表示されています。
これはResendが内部で利用するAmazon SESのデフォルト設定です。

**Custom Return Path** を設定することで、送信元を `kozoka-ai.co.jp` に変更でき、
メールの信頼性・ブランド統一性が向上します。

### 作業の影響範囲

- **コード変更**: 不要
- **サービス停止**: なし（設定追加のみ）
- **既存メール配信への影響**: なし（DNS伝播完了後から新しい表示に切り替わる）

### 必要な権限

- Resendダッシュボードの管理者権限
- DNSプロバイダ（`kozoka-ai.co.jp` を管理しているサービス）の編集権限

### 所要時間

- 作業自体: 約10〜15分
- DNS伝播待ち: 数分〜最大48時間

---

## Step 1: ResendダッシュボードでCustom Return Pathを設定

### 1-1. Resendダッシュボードにログイン

- URL: https://resend.com/domains
- ログイン後、ドメイン一覧画面が表示される

### 1-2. ドメインを選択

- ドメイン一覧から **`kozoka-ai.co.jp`** をクリック

### 1-3. Custom Return Path を設定

- ドメイン設定画面で「**Custom Return Path**」または「**Set custom return-path**」セクションを探す
- サブドメインの入力欄に以下を入力:

```
mail
```

- これにより **`mail.kozoka-ai.co.jp`** がMAIL FROMドメインとして設定される
- 「Save」または「Set」ボタンをクリック

### 1-4. DNSレコード情報を確認

設定を保存すると、Resendが追加すべき **DNSレコード** を表示します。
以下の2種類のレコードが提示されるので、メモしてください。

| 項目 | 内容 |
|------|------|
| レコード1 | **MXレコード**（メール交換レコード） |
| レコード2 | **TXTレコード**（SPF認証用） |

提示される値の例（実際の値はResend画面で確認してください）:

| 種別 | ホスト名 | 値（例） | 優先度 |
|------|----------|----------|--------|
| MX | `mail.kozoka-ai.co.jp` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `mail.kozoka-ai.co.jp` | `v=spf1 include:amazonses.com ~all` | - |

---

## Step 2: DNSレコードを追加

`kozoka-ai.co.jp` を管理しているDNSプロバイダ（お名前.com、Route 53、Cloudflareなど）で、
Step 1-4 でメモしたレコードを追加します。

### 2-1. DNSプロバイダの管理画面にログイン

### 2-2. MXレコードを追加

| 設定項目 | 入力値 |
|----------|--------|
| レコードタイプ | **MX** |
| ホスト名（Name） | `mail`（または `mail.kozoka-ai.co.jp`。プロバイダにより表記が異なる） |
| 値（Value） | Resendが提示した値をそのまま入力 |
| 優先度（Priority） | Resendが提示した値（通常 `10`） |
| TTL | `3600`（デフォルトのままでOK） |

### 2-3. TXTレコードを追加

| 設定項目 | 入力値 |
|----------|--------|
| レコードタイプ | **TXT** |
| ホスト名（Name） | `mail`（または `mail.kozoka-ai.co.jp`） |
| 値（Value） | Resendが提示した値をそのまま入力 |
| TTL | `3600`（デフォルトのままでOK） |

### 2-4. 保存

レコードを保存します。DNS伝播には数分〜最大48時間かかる場合があります。

---

## Step 3: 検証

### 3-1. ResendダッシュボードでDNS検証

1. Resendダッシュボード（https://resend.com/domains）を開く
2. `kozoka-ai.co.jp` をクリック
3. Custom Return Path セクションで「**Check DNS**」または「**Verify**」ボタンをクリック
4. ステータスが **Verified**（緑色）になれば設定完了

DNS伝播が完了していない場合は「Pending」と表示されます。
数分〜数時間後に再度「Check DNS」を押してください。

### 3-2. テストメール送信で確認

設定完了後、次回のテストメール送信時に以下を確認します。

**Gmailでの確認方法**:
1. テストメールを開く
2. 送信者名の右にある「▼」をクリック → 「詳細を表示」を選択
3. 以下の項目を確認:

| 項目 | 設定前 | 設定後（期待値） |
|------|--------|-----------------|
| mailed-by（送信元） | `ap-northeast-1.amazonses.com` | `kozoka-ai.co.jp` |

---

## トラブルシューティング

### DNS検証が通らない場合

| 原因 | 対処法 |
|------|--------|
| DNS伝播が未完了 | 数時間〜最大48時間待ってから再度「Check DNS」を実行 |
| ホスト名の入力ミス | `mail` のみか `mail.kozoka-ai.co.jp` のフル表記か、DNSプロバイダの仕様を確認 |
| 値のコピーミス | Resendダッシュボードから値を再度コピーして貼り直す |
| 既存レコードとの競合 | `mail.kozoka-ai.co.jp` に既存のMX/TXTレコードがないか確認 |

### 設定完了後もamazonses.comが表示される場合

- DNS伝播が完全に完了するまで、旧表示が残ることがあります
- 24〜48時間経過後に再度テストメールを送信して確認してください

---

## 参考リンク

- [Resend - Custom Return Path](https://resend.com/docs/dashboard/domains/introduction)
- [Resend - Domain Authentication](https://resend.com/docs/dashboard/domains/introduction)

---

## 完了報告

設定が完了したら、以下の情報を開発チームに共有してください:

- [ ] Resendダッシュボードで Custom Return Path が **Verified** になった
- [ ] 追加したDNSレコード（MX、TXT）の値
- [ ] DNS検証が通過した日時

---

最終更新日: 2026-02-12
