# Custom Return Path 設定記録

## 概要

メールの「送信元（mailed-by）」を `kozoka-ai.co.jp` として表示するための **Custom Return Path** 設定です。
Resendが内部で利用するAmazon SESのデフォルトでは `ap-northeast-1.amazonses.com` と表示されますが、
Custom Return Pathを設定することで自社ドメインに変更でき、メールの信頼性・ブランド統一性が向上します。

### 現在のステータス: 設定済み（全レコード Verified）

| 項目 | ステータス |
|------|-----------|
| Domain (`kozoka-ai.co.jp`) | **Verified** |
| DKIM (`resend._domainkey`) | **Verified** |
| SPF MX (`send`) | **Verified** |
| SPF TXT (`send`) | **Verified** |

---

## 現在の設定状況

### Resend ドメイン設定

- **ドメイン**: `kozoka-ai.co.jp`
- **Custom Return Path サブドメイン**: `send`（= `send.kozoka-ai.co.jp`）
- **ダッシュボード**: https://resend.com/domains

### Route53 DNS レコード（Resend関連）

| レコード名 | タイプ | 値 | 用途 |
|-----------|--------|-----|------|
| `send.kozoka-ai.co.jp` | MX | `10 feedback-smtp.ap-northeast-1.amazonses.com` | Resend Return Path（バウンス処理） |
| `send.kozoka-ai.co.jp` | TXT | `v=spf1 include:amazonses.com ~all` | Resend SPF認証 |
| `resend._domainkey.kozoka-ai.co.jp` | TXT | DKIM公開鍵（Resend発行） | Resend DKIM署名 |
| `_dmarc.kozoka-ai.co.jp` | TXT | `v=DMARC1; p=none;` | DMARC ポリシー |

### Route53 DNS レコード（Gmail関連）

| レコード名 | タイプ | 値 | 用途 |
|-----------|--------|-----|------|
| `kozoka-ai.co.jp` | MX | `1 smtp.google.com.` | Gmail受信 |
| `kozoka-ai.co.jp` | TXT | `v=spf1 include:_spf.google.com ~all` | Gmail SPF認証 |

---

## Gmail との共存

**競合なし** — 以下のように完全にドメインが分離されています。

| 用途 | ドメイン | 備考 |
|------|---------|------|
| Gmail（メール受信） | `kozoka-ai.co.jp`（ルートドメイン） | MX: `smtp.google.com` |
| Resend（メール送信 Return Path） | `send.kozoka-ai.co.jp`（サブドメイン） | MX: `feedback-smtp...amazonses.com` |

- `xxx@kozoka-ai.co.jp` でのGmail利用（受信・送信）に影響なし
- ResendのReturn Pathはサブドメイン `send.kozoka-ai.co.jp` を使用するため、ルートドメインのMXレコードとは干渉しない

---

## 確認方法

### テストメール送信で mailed-by を確認

Custom Return Pathが正しく機能しているかは、テストメールの `mailed-by` ヘッダーで確認できます。

**手順:**

1. Staging Workflow でテストメールを送信する（通常のPRフローで自動送信）
2. テストメールをGmailで受信
3. 送信者名の右にある「▼」をクリック → 詳細を表示
4. 以下の項目を確認:

| 項目 | 期待値（設定済み） | 設定前の表示 |
|------|-------------------|-------------|
| mailed-by | `kozoka-ai.co.jp` | `ap-northeast-1.amazonses.com` |

### Resend ダッシュボードで確認

1. https://resend.com/domains を開く
2. `kozoka-ai.co.jp` をクリック
3. 全項目が **Verified**（緑色）であることを確認

---

## トラブルシューティング

### テストメールで `mailed-by: amazonses.com` と表示される場合

| 確認ポイント | 対処法 |
|------------|--------|
| テストメールの送信日時 | 設定完了前に送信されたメールは旧表示のまま。新しいテストメールを送信して再確認 |
| Resendダッシュボードのステータス | https://resend.com/domains で全項目が Verified か確認 |
| DNS伝播 | `dig send.kozoka-ai.co.jp MX` でレコードが返るか確認 |
| キャッシュ | Gmailのキャッシュが残っている場合あり。別のメールアドレスに送信して確認 |

### DNS確認コマンド

```bash
# Return Path MX レコード
dig send.kozoka-ai.co.jp MX

# Return Path SPF レコード
dig send.kozoka-ai.co.jp TXT

# DKIM レコード
dig resend._domainkey.kozoka-ai.co.jp TXT

# DMARC レコード
dig _dmarc.kozoka-ai.co.jp TXT
```

---

## 参考: 再設定が必要になった場合

ドメイン変更やResendアカウント再作成などで再設定が必要になった場合の手順です。

### Step 1: Resend ダッシュボードで設定

1. https://resend.com/domains でドメインを選択
2. Custom Return Path セクションでサブドメインを入力（現在: `send`）
3. 保存後、追加すべきDNSレコード（MX + TXT）が表示される

### Step 2: DNS レコードを追加

DNSプロバイダ（Route53等）で、Resendが提示した以下のレコードを追加:

| 種別 | ホスト名 | 値（例） | 優先度 |
|------|----------|----------|--------|
| MX | `send.kozoka-ai.co.jp` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `send.kozoka-ai.co.jp` | `v=spf1 include:amazonses.com ~all` | - |

### Step 3: 検証

1. Resendダッシュボードで「Check DNS」をクリック
2. ステータスが **Verified** になれば完了
3. DNS伝播には数分〜最大48時間かかる場合がある

---

## 参考リンク

- [Resend - Custom Return Path](https://resend.com/docs/dashboard/domains/introduction)
- [Resend - Domain Authentication](https://resend.com/docs/dashboard/domains/introduction)

---

最終更新日: 2026-02-13
