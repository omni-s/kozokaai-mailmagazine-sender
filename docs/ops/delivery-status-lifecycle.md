# 配信ステータスライフサイクル

## 概要

`config.json` の `status` フィールドは、メール配信パイプラインの進捗を追跡し、重複送信を防止するための仕組みです。

各アーカイブの `config.json` には以下の 5 つの status 値のいずれかが設定され、配信パイプラインの各ステージを通過するたびに遷移します。

| status | 意味 |
|--------|------|
| `pending` | コミット直後（テスト未実施） |
| `tested` | テスト配信済み（本番配信可能） |
| `delivered` | 即時配信済み（終端） |
| `waiting-schedule-delivery` | 予約配信待機中 |
| `schedule-delivered` | 予約配信済み（終端） |

---

## status 遷移図

### 即時配信

```
pending → tested → delivered
```

### 予約配信

```
pending → tested → waiting-schedule-delivery → schedule-delivered
```

---

## 各 status の詳細

### pending

| 項目 | 内容 |
|------|------|
| 設定タイミング | `pnpm run commit` 実行時 |
| 設定スクリプト | `src/scripts/commit.ts` L814 |
| 前提条件 | なし（初期状態） |
| 次の遷移 | → `tested` |

`commit.ts` が `config.json` を生成する際に `"status": "pending"` を設定します。

### tested

| 項目 | 内容 |
|------|------|
| 設定タイミング | Staging Workflow でテスト配信成功後 |
| 設定スクリプト | `src/scripts/send-test-email.ts` L176 |
| 前提条件 | `status === 'pending'`（または後方互換: `status === null && sentAt === null`） |
| 次の遷移 | → `delivered` または `waiting-schedule-delivery` |
| エラー時 | `process.exit(1)` でパイプライン停止 |

`send-test-email.ts` がテスト配信成功後、`updateConfigFields()` で status を `tested` に更新します。

### delivered

| 項目 | 内容 |
|------|------|
| 設定タイミング | 即時配信（`scheduledAt === null` または過去日時）成功時 |
| 設定スクリプト | `src/scripts/production-dispatcher.ts` L106-108 |
| 前提条件 | `status === 'tested'` |
| 次の遷移 | なし（終端） |
| エラー時 | `process.exit(1)` でパイプライン停止 |

`production-dispatcher.ts` が本番配信成功後、`sentAt` と `status` を同時に更新します。

### waiting-schedule-delivery

| 項目 | 内容 |
|------|------|
| 設定タイミング | 予約配信の待機開始時（`scheduledAt > 現在時刻`） |
| 設定スクリプト | `src/scripts/production-dispatcher.ts` L65 |
| 前提条件 | `status === 'tested'` |
| 次の遷移 | → `schedule-delivered` |
| エラー時 | `process.exit(1)` でパイプライン停止 |

`production-dispatcher.ts` が `scheduledAt` が未来日時であることを検知した場合に設定します。実際の配信は `scheduled-email-delivery.yml` の cron（5分ごと）に委ねます。

### schedule-delivered

| 項目 | 内容 |
|------|------|
| 設定タイミング | 予約配信成功時 |
| 設定スクリプト | `src/scripts/send-scheduled-emails.ts` L115-118 |
| 前提条件 | `status === 'waiting-schedule-delivery'` |
| 次の遷移 | なし（終端） |
| エラー時 | `failedCount++` でサマリーに記録、最終的に `process.exit(1)` |

`send-scheduled-emails.ts` が予約配信成功後、`sentAt` と `status` を同時に更新します。

---

## config.json の完全な構造

```json
{
  "subject": "メール件名",
  "segmentId": "a355a0bd-32fa-4ef4-b6d5-7341f702d35b",
  "scheduledAt": null,
  "sentAt": null,
  "status": "pending"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `subject` | `string` | メール件名（必須） |
| `segmentId` | `string` (UUID) | Resend Segment ID（推奨） |
| `audienceId` | `string` | Resend Audience ID（非推奨、後方互換） |
| `scheduledAt` | `string \| null` | 予約配信日時（ISO 8601, UTC）。`null` = 即時配信 |
| `sentAt` | `string \| null` | 送信日時（ISO 8601）。`null` = 未送信 |
| `status` | `string \| null` | 配信ステータス（5値 + null） |

型定義: `src/lib/config-schema.ts`

---

## 即時配信フロー（status 遷移付き）

```
commit.ts
  → config.json 生成: status="pending", scheduledAt=null
  → Git commit: "MAIL: {name}(pending)"
  → Git push
      ↓
send-test-email.ts (Staging Workflow)
  → テスト配信実行
  → status="tested"
      ↓
PR マージ → Manual Approval
      ↓
production-dispatcher.ts (Production Workflow)
  → scheduledAt === null → 即時配信実行
  → status="delivered", sentAt=ISO8601
  → .git-commit-message: "MAIL: Update config(delivered)"
  → Git commit & push
```

---

## 予約配信フロー（status 遷移付き）

```
commit.ts
  → config.json 生成: status="pending", scheduledAt=ISO8601
  → Git commit: "MAIL: {name}(pending)"
  → Git push
      ↓
send-test-email.ts (Staging Workflow)
  → テスト配信実行
  → status="tested"
      ↓
PR マージ → Manual Approval
      ↓
production-dispatcher.ts (Production Workflow)
  → scheduledAt > 現在時刻 → 予約配信待機
  → status="waiting-schedule-delivery"
  → .git-commit-message: "MAIL: Update config(waiting-schedule-delivery)"
  → Git commit & push
      ↓
send-scheduled-emails.ts (cron: 5分ごと)
  → scheduledAt <= 現在時刻 かつ status="waiting-schedule-delivery"
  → 本番配信実行
  → status="schedule-delivered", sentAt=ISO8601
  → .git-commit-message: "MAIL: Update config(schedule-delivered)"
  → Git commit & push
```

---

## S3 とローカル（Git）の同期メカニズム

S3 が config.json の Source of Truth です。

`updateConfigFields()` (`src/lib/s3.ts` L622-679) は以下の順序で処理します:

1. **S3 更新**（必須）: `GetObjectCommand` → JSON更新 → `PutObjectCommand`
2. **ローカル更新**（best-effort）: `src/archives/YYYY/MM/DD-MSG/config.json` を同期

ローカル更新により、workflow の `git add → git commit → git push` ステップで正常に差分を検知できます。

ローカル更新が失敗した場合は警告のみ出力し、S3 は更新済みのため処理を継続します。

---

## Git コミットメッセージと status の対応

| コミットメッセージ | status | 実行元 |
|------------------|--------|--------|
| `MAIL: {name}(pending)` | `pending` | `commit.ts`（ローカル） |
| `MAIL: Update config(waiting-schedule-delivery)` | `waiting-schedule-delivery` | `production.yml` |
| `MAIL: Update config(delivered)` | `delivered` | `production.yml` |
| `MAIL: Update config(schedule-delivered)` | `schedule-delivered` | `scheduled-email-delivery.yml` |

**注**: `tested` への遷移は Staging Workflow 内で完結し、Git コミットは発生しません（S3 のみ更新）。

### .git-commit-message ファイル

スクリプトが `writeFileSync('.git-commit-message', ...)` でコミットメッセージを書き出し、workflow の shell ステップが `cat .git-commit-message` で読み取ります。

```yaml
# production.yml / scheduled-email-delivery.yml
COMMIT_MSG=$(cat .git-commit-message 2>/dev/null || echo "MAIL: Update config")
git commit -m "$COMMIT_MSG"
```

---

## エラーハンドリング

status 更新が失敗した場合、各スクリプトは `process.exit(1)` でパイプラインを停止します。

**理由**: status が遷移しないと後続ステップがアーカイブを検出できず、配信が永久にブロックされるためです。

### 具体的なシナリオ

| シナリオ | 挙動 | 復旧方法 |
|---------|------|---------|
| テスト配信成功 → `tested` 更新失敗 | CI 失敗（Staging Workflow） | Staging Workflow 再実行（テストメール重複送信の可能性あり） |
| 即時配信成功 → `delivered` 更新失敗 | CI 失敗（Production Workflow） | S3 の config.json を手動で更新（配信は完了済み） |
| 予約配信待機 → `waiting-schedule-delivery` 更新失敗 | CI 失敗（Production Workflow） | Production Workflow 再実行 |
| 予約配信成功 → `schedule-delivered` 更新失敗 | cron ジョブ失敗 | S3 の config.json を手動で更新（配信は完了済み） |

---

## 後方互換性

### getLatestPendingArchive()

`src/lib/email-sender.ts` L59-65

status フィールドが未定義（`null`）の古い config.json にも対応します。

```typescript
return status === 'pending' || (status === null && a.config.sentAt === null);
```

- `status === 'pending'` → 新形式
- `status === null && sentAt === null` → 旧形式（status 導入前）

### getLatestTestedArchive()

`src/lib/email-sender.ts` L70-73

厳密に `status === 'tested'` のみを対象とします（後方互換なし）。

```typescript
return archives.find((a) => a.config.status === 'tested') || null;
```

旧形式の config.json は `tested` を経由しないため、本番配信の対象になりません。

---

## status の確認方法

### S3 から確認

```bash
aws s3 cp s3://<bucket>/archives/YYYY/MM/DD-MSG/config.json - | jq .status
```

### Git（ローカル）から確認

```bash
cat src/archives/YYYY/MM/DD-MSG/config.json | jq .status
```

### Git ログから判別

```bash
git log --oneline --grep="MAIL:"
```

コミットメッセージの括弧内が status を示します:

```
abc1234 MAIL: summer-sale(pending)
def5678 MAIL: Update config(delivered)
```

---

## 手動リカバリ

status が意図しない状態で停止した場合の手動更新手順です。

### 手順

**1. S3 の config.json を更新**

```bash
# ダウンロード
aws s3 cp s3://<bucket>/archives/YYYY/MM/DD-MSG/config.json config.json

# status を修正（例: waiting-schedule-delivery に変更）
jq '.status = "waiting-schedule-delivery"' config.json > config_updated.json

# アップロード
aws s3 cp config_updated.json s3://<bucket>/archives/YYYY/MM/DD-MSG/config.json
```

**2. ローカルの config.json も更新**

```bash
# Git リポジトリ内の config.json を同じ値に更新
jq '.status = "waiting-schedule-delivery"' src/archives/YYYY/MM/DD-MSG/config.json > tmp.json
mv tmp.json src/archives/YYYY/MM/DD-MSG/config.json
git add src/archives/YYYY/MM/DD-MSG/config.json
git commit -m "MAIL: Manual status recovery"
git push
```

### 注意事項

- **重複送信リスク**: `delivered` や `schedule-delivered` を別の status に戻すと、再配信される可能性があります
- **S3 が真の Source of Truth**: ローカルのみ更新しても、スクリプトは S3 を参照するため効果がありません
- Resend Dashboard で配信済みか確認してから操作してください

---

## 関連ファイル一覧

| ファイル | 役割 |
|---------|------|
| `src/lib/config-schema.ts` | status の型定義・Zod スキーマ・定数 |
| `src/lib/email-sender.ts` | status フィルタ（`getLatestPendingArchive`, `getLatestTestedArchive`） |
| `src/lib/s3.ts` | `updateConfigFields`（S3 + ローカル同期） |
| `src/scripts/commit.ts` | `pending` 設定 |
| `src/scripts/send-test-email.ts` | `tested` 設定 |
| `src/scripts/production-dispatcher.ts` | `delivered` / `waiting-schedule-delivery` 設定 |
| `src/scripts/send-scheduled-emails.ts` | `schedule-delivered` 設定 |
| `.github/workflows/production.yml` | `.git-commit-message` 読み取り・Git commit |
| `.github/workflows/scheduled-email-delivery.yml` | `.git-commit-message` 読み取り・Git commit |

---

## 関連ドキュメント

- [workflow.md](./workflow.md): 日常的な配信フロー
- [scheduled-delivery-verification.md](./scheduled-delivery-verification.md): 予約配信の確認方法
- [troubleshooting.md](./troubleshooting.md): トラブルシューティング
- [../specs/architecture.md](../specs/architecture.md): システムアーキテクチャ

---

最終更新日: 2026-02-20
