# 予約配信の確認方法

## 概要

このドキュメントでは、予約配信が正常に行われたかどうかを確認する方法を説明します。

### 予約配信システムの仕組み

予約配信は以下の流れで実行されます:

1. `pnpm run commit` で配信日時（JST）を指定してアーカイブ作成
2. `config.json` の `scheduledAt` フィールドに配信日時（UTC）が保存
3. GitHub Actions の Scheduled Email Delivery ワークフロー（5分ごと実行）が配信対象をチェック
4. 配信予定時刻になったら自動的にメール配信
5. 配信完了後、`config.json` の `sentAt` フィールドが更新される

### 確認が必要なタイミング

- 配信予定時刻を過ぎた後、メールが正常に配信されたか確認したい時
- 配信が失敗していないか定期的にチェックしたい時
- トラブルシューティングのため、過去の配信履歴を確認したい時

### 確認方法の3段階

1. **即座に確認**: GitHub Actions のワークフロー実行履歴を確認
2. **中期的確認**: Resend Dashboard で配信ログを確認
3. **長期的確認**: S3 の `config.json` で `sentAt` フィールドを確認

---

## 即座に確認できる方法

### GitHub Actions ワークフロー確認

配信が正常に実行されたかを最も早く確認できる方法です。

#### 手順

1. GitHubリポジトリにアクセス
2. **Actions** タブをクリック
3. 左サイドバーから **Scheduled Email Delivery** ワークフローを選択
4. 最新の実行履歴（Run）をクリック
5. **Run npx tsx src/scripts/send-scheduled-emails.ts** ステップを展開

#### 確認ポイント

正常に配信された場合、以下のようなログが表示されます:

```
✓ 本番メール配信
  送信ID: 2dec756c-f97f-45c9-9212-f6789a4cc123
✓ sentAt更新完了
```

#### 期待値

| 項目 | 期待値 | 説明 |
|------|--------|------|
| ステータス | ✓（成功） | チェックマークが表示されていること |
| 送信ID | UUID形式 | Resend APIから返却された送信IDが記録されていること |
| sentAt更新 | `✓ sentAt更新完了` | config.jsonのsentAtフィールドが更新されたこと |

#### 確認例

**正常なログ**:
```
[2026-01-20T06:30:15Z] 対象アーカイブ: archives/2026/01/20-gui-delivery-test
[2026-01-20T06:30:20Z] ✓ 本番メール配信
[2026-01-20T06:30:20Z]   送信ID: 2dec756c-f97f-45c9-9212-f6789a4cc123
[2026-01-20T06:30:25Z] ✓ sentAt更新完了
```

**配信対象なしのログ**:
```
[2026-01-20T06:35:00Z] 配信対象のメールはありません
```

---

## Resend Dashboard での配信ログ確認

GitHub Actions のログで送信IDを確認した後、Resend Dashboard で詳細な配信状況を確認できます。

### 手順

1. [Resend Dashboard](https://resend.com/emails) にアクセス
2. **Emails** タブを開く
3. 送信ID（GitHub Actionsログから取得）で検索
   - または、配信予定時刻前後の時間帯でフィルタリング

### 確認ポイント

| 項目 | 期待値 | 説明 |
|------|--------|------|
| Status | `delivered` または `sent` | メールが正常に配信されたこと |
| Timestamp | 配信予定時刻と一致 | `scheduledAt` と近い時刻であること |
| Recipients | Audience内のメンバー数と一致 | Segmentに登録されている全員に配信されたこと |
| Bounce Rate | 0% または許容範囲内 | バウンス（配信失敗）が少ないこと |

### ステータスの意味

| ステータス | 意味 | 対処 |
|-----------|------|------|
| `sent` | Resend APIに受理された | 正常（配信プロセス進行中） |
| `delivered` | メールサーバーに配信完了 | 正常（配信成功） |
| `bounced` | 配信失敗（存在しないアドレス等） | Audience のメールアドレスを確認 |
| `failed` | 送信エラー | エラー詳細を確認し、トラブルシューティング |

---

## 中期的確認（S3での config.json 確認）

`sentAt` フィールドが正しく更新されているか確認する方法です。

### 目的

- 配信完了の証跡を確認
- 重複送信防止メカニズムが正常に動作していることを確認
- 配信履歴の長期的な記録

### 手順

#### AWS CLI を使用する場合

```bash
# config.json を取得して表示
aws s3 cp s3://<bucket-name>/archives/YYYY/MM/DD-MSG/config.json - | jq .
```

**例**:
```bash
aws s3 cp s3://kozokaai-MAIL-ASSETS/archives/2026/01/20-gui-delivery-test/config.json - | jq .
```

#### 期待される出力

```json
{
  "subject": "【GUI配信テスト】予約配信機能の動作確認",
  "segmentId": "a355a0bd-32fa-4ef4-b6d5-7341f702d35b",
  "scheduledAt": "2026-01-20T06:30:00.000Z",
  "sentAt": "2026-01-20T06:30:35.123Z"
}
```

### 確認ポイント

| フィールド | 期待値 | 説明 |
|-----------|--------|------|
| `sentAt` | **null でない** | 配信が完了していること |
| `sentAt` の形式 | ISO 8601形式 | `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `sentAt` と `scheduledAt` の差 | 5分以内 | 配信タイミングが正常であること |

### sentAt が null の場合

配信が完了していない可能性があります。以下を確認してください:

1. 現在時刻が `scheduledAt` を過ぎているか
2. GitHub Actions の Scheduled Email Delivery が正常に実行されているか
3. エラーログが出力されていないか

---

## 技術的背景

### sentAt 更新メカニズム

#### 実装場所

`src/lib/s3.ts` の `updateConfigSentAt()` 関数

#### 動作

1. S3から既存の `config.json` を読み込み（`GetObjectCommand`）
2. JSONをパース
3. `sentAt` フィールドを現在時刻（ISO 8601形式、UTC）で更新
4. S3に書き戻す（`PutObjectCommand` 使用）

#### 重要なポイント

- ローカルファイルではなく、**S3に直接書き込み**される
- Git には **自動的にコミットされない**（S3が真の配信記録）
- タイムゾーンは **UTC** で保存される

#### コード例

```typescript
export async function updateConfigSentAt(
  archivePath: string,
  sentAt: string
): Promise<void> {
  const configKey = `${archivePath}/config.json`;

  // S3から既存のconfig.jsonを取得
  const getCommand = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: configKey,
  });
  const { Body } = await s3Client.send(getCommand);
  const configContent = await Body?.transformToString();
  const config = JSON.parse(configContent || '{}');

  // sentAtを更新
  config.sentAt = sentAt;

  // S3に書き戻す
  const putCommand = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: configKey,
    Body: JSON.stringify(config, null, 2),
    ContentType: 'application/json',
  });
  await s3Client.send(putCommand);
}
```

### 重複送信防止メカニズム

#### 実装場所

`src/scripts/send-scheduled-emails.ts` L142

#### 保護の仕組み

```typescript
if (config.sentAt !== null) {
  return false;  // 配信対象から除外
}
```

**動作**:
- cron実行（5分ごと）でも、`sentAt !== null` のメールは除外される
- 一度配信されたメールは、何度スクリプトが実行されても再配信されない
- 手動で `workflow_dispatch` を実行しても、同じメールは再送されない

#### 保護される理由

1. **scheduledAt の判定**: 配信予定時刻の前後5分以内のみ対象
2. **sentAt の判定**: `sentAt === null` のメールのみ配信
3. **両方の条件を満たす必要がある**: ANDロジック

### 配信対象の判定条件

#### 3つの必須条件

1. `sentAt === null` （未配信）
2. `scheduledAt` が存在する（予約配信対象）
3. 現在時刻と `scheduledAt` の差が **0～5分以内**

#### 判定ロジック

```typescript
function isScheduledForDelivery(config: MailConfig): boolean {
  if (config.sentAt !== null) return false;  // 既に配信済み
  if (!config.scheduledAt) return false;     // 予約配信ではない

  const now = new Date();
  const scheduledTime = new Date(config.scheduledAt);
  const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 1000 / 60;

  return diffMinutes >= 0 && diffMinutes <= 5;  // 0～5分以内
}
```

#### なぜ5分以内なのか

- Scheduled Email Delivery ワークフローは **5分ごと** に実行される
- cronの実行タイミングによるズレを吸収するため
- 配信予定時刻を過ぎても、次のcron実行（最大5分後）で確実に配信される

---

## トラブルシューティング

### 配信されない場合

#### チェックリスト

1. **config.json の内容確認**
   ```bash
   aws s3 cp s3://<bucket>/archives/YYYY/MM/DD-MSG/config.json -
   ```
   - `scheduledAt` が正しく設定されているか
   - `sentAt` が既に設定されていないか（重複防止）
   - `segmentId` が有効なSegment IDか

2. **GitHub Actions の実行履歴**
   - Scheduled Email Delivery が5分ごとに実行されているか
   - エラーが発生していないか
   - ワークフローが無効化されていないか

3. **配信時刻の確認**
   - `scheduledAt` が **UTC時刻** で保存されている
   - 現在時刻（UTC）が配信予定時刻を過ぎているか
   - JST → UTC の変換が正しく行われているか（`pnpm run commit` 時）

4. **Resend API キーの有効性**
   - GitHub Secrets で `RESEND_API_KEY` が正しく設定されているか
   - APIキーの有効期限が切れていないか
   - APIキーの権限が `broadcasts.send` を含んでいるか

5. **Segment ID の有効性**
   - Resend Dashboard で Segment ID が存在するか
   - Segment にメンバーが登録されているか

### 配信失敗時のログ確認

#### エラーパターンと対処法

| エラーメッセージ | 原因 | 対処法 |
|----------------|------|--------|
| `mail.html 読み込み失敗` | S3にファイルが存在しない | アーカイブ作成手順を確認 |
| `本番配信 API エラー` | Resend API エラー | Resend Dashboard でエラー詳細確認 |
| `sentAt更新失敗` | S3書き込み権限エラー | AWS IAMロール確認 |
| `Invalid segment ID` | Segment IDが存在しない | Resend Dashboard で Segment 確認 |
| `API key not found` | Resend API キーが無効 | GitHub Secrets 確認 |

#### エラーログの例

**S3読み込みエラー**:
```
Error: Failed to fetch mail.html from S3
  at send-scheduled-emails.ts:95
  Caused by: NoSuchKey: The specified key does not exist.
```

**Resend APIエラー**:
```
Error: Failed to send email via Resend
  at send-scheduled-emails.ts:120
  Caused by: { message: "Invalid segment ID", statusCode: 400 }
```

### 手動再配信

何らかの理由で配信が失敗した場合、手動で再配信できます。

#### 手順

**1. sentAt をリセット**

```bash
# config.json をローカルにダウンロード
aws s3 cp s3://<bucket>/archives/YYYY/MM/DD-MSG/config.json config.json

# sentAt を null に変更
jq '.sentAt = null' config.json > config_updated.json

# S3にアップロード
aws s3 cp config_updated.json s3://<bucket>/archives/YYYY/MM/DD-MSG/config.json
```

**2. scheduledAt を現在時刻に更新（オプション）**

配信予定時刻が5分以上前の場合、`scheduledAt` も更新する必要があります:

```bash
# 現在時刻（UTC）を取得
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# scheduledAt を現在時刻に更新
jq --arg now "$NOW" '.scheduledAt = $now | .sentAt = null' config.json > config_updated.json

# S3にアップロード
aws s3 cp config_updated.json s3://<bucket>/archives/YYYY/MM/DD-MSG/config.json
```

**3. 手動実行**

GitHub Actions → **Scheduled Email Delivery** → **Run workflow** ボタンをクリック

#### 注意事項

- 重複送信に注意してください（`sentAt` をリセットすると、再度配信されます）
- Resend Dashboard で既に配信済みか確認してから実行してください
- Audience のメンバーが重複してメールを受信する可能性があります

### よくある質問

#### Q1. 配信予定時刻を過ぎているのに配信されない

**回答**:
- Scheduled Email Delivery ワークフローは5分ごとに実行されます
- 最大5分の遅延が発生する可能性があります
- 5分以上経過しても配信されない場合は、上記のチェックリストを確認してください

#### Q2. sentAt が更新されているのにメールが届かない

**回答**:
- Resend Dashboard で配信ステータスを確認してください
- `bounced` または `failed` の場合、メールアドレスが無効な可能性があります
- スパムフィルタに引っかかっている可能性もあります

#### Q3. 同じメールが2回配信された

**回答**:
- 手動で `sentAt` をリセットした可能性があります
- GitHub Actions のワークフローを手動で複数回実行した可能性があります
- `sentAt` が正しく更新されなかった可能性があります（S3書き込みエラー）

---

## 今後の改善提案

### Resend Webhooks の活用

#### 目的
- 配信完了時のWebhook受信 → ログ記録
- 失敗時の自動アラート（Slack, Email）

#### 実装案

**Webhook エンドポイント**: `/api/webhooks/resend`

**処理内容**:
1. Resend から配信イベントを受信
2. `email.delivered` イベント → ログ記録
3. `email.bounced` イベント → Slack通知
4. S3に配信履歴を保存

#### 参考
- [Resend Webhooks ドキュメント](https://resend.com/docs/api-reference/webhooks)

### Dashboard UI の実装

#### 目的
- 配信履歴一覧表示（S3から取得）
- 配信状況のリアルタイム表示
- Resend Dashboard との連携

#### 実装案

**実装場所**: `src/app/dashboard/page.tsx`

**機能**:
1. S3から全 `config.json` を取得
2. 配信履歴をテーブル表示
   - 配信日時（JST）
   - 件名
   - ステータス（配信済み/予約中/失敗）
   - Resend Dashboard へのリンク
3. フィルタリング・検索機能

### 定期レポート生成

#### 目的
- 配信結果の自動通知
- 配信履歴の可視化

#### 実装案

**仕組み**:
1. `scheduled-email-delivery.yml` 完了後、JSON形式のレポート生成
2. GitHub Issues または Slack通知で配信結果を通知

**レポート内容**:
- 配信日時
- 件名
- 送信ID
- 配信数
- バウンス数
- エラー（ある場合）

---

## 関連ドキュメント

- [workflow.md](./workflow.md): 日常的な配信フロー
- [troubleshooting.md](./troubleshooting.md): トラブルシューティング
- [../specs/architecture.md](../specs/architecture.md): システムアーキテクチャ
- [../dev/branch.md](../dev/branch.md): ブランチ戦略とCI/CD

---

最終更新日: 2026-01-20
